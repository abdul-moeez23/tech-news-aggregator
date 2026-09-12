"""
model_loader.py — Phase 11: Semantic Categorization

Responsible for loading and caching the sentence-transformer model used for
semantic article categorization.  The model is loaded **once per process**
(i.e. once per Celery worker) and re-used for every subsequent call, avoiding
the expensive disk/network I/O on every Celery task execution.

Model chosen: all-MiniLM-L6-v2
  - Very lightweight (~80 MB on disk)
  - Fast CPU inference
  - Good semantic quality for short texts (titles/summaries)
  - No GPU required
"""

import logging
import threading

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level cache — shared across all calls within the same Python process
# ---------------------------------------------------------------------------
_model = None          # The loaded SentenceTransformer instance
_model_lock = threading.Lock()   # Prevent race conditions on first load

# Name of the model to download/load from the sentence-transformers hub
MODEL_NAME = "all-MiniLM-L6-v2"

# Minimum cosine similarity score for a category match to be considered valid.
# Articles whose best matching category falls below this threshold will be left
# uncategorized (category=None) rather than force-assigned a wrong category.
SIMILARITY_THRESHOLD = 0.25


def get_model():
    """
    Return the cached SentenceTransformer model, loading it on first call.

    Thread-safe: uses a lock so that if multiple Celery tasks start
    simultaneously in the same worker process only one of them actually loads
    the model; all others block until it is ready and then use the cached copy.

    Returns
    -------
    sentence_transformers.SentenceTransformer
        The ready-to-use model instance.

    Raises
    ------
    RuntimeError
        If sentence-transformers is not installed or the model cannot be
        downloaded / loaded.
    """
    global _model

    # Fast path — model already loaded, no locking overhead
    if _model is not None:
        return _model

    with _model_lock:
        # Double-checked locking: another thread may have loaded while we waited
        if _model is not None:
            return _model

        try:
            from sentence_transformers import SentenceTransformer
            logger.info(
                "[ModelLoader] Loading sentence-transformer model '%s' "
                "(this happens once per worker process)...",
                MODEL_NAME,
            )
            _model = SentenceTransformer(MODEL_NAME)
            logger.info(
                "[ModelLoader] Model '%s' loaded successfully and cached.",
                MODEL_NAME,
            )
        except ImportError as exc:
            raise RuntimeError(
                "sentence-transformers is not installed. "
                "Run: pip install sentence-transformers"
            ) from exc
        except Exception as exc:
            logger.error(
                "[ModelLoader] Failed to load model '%s': %s", MODEL_NAME, exc
            )
            raise

    return _model


def encode_texts(texts, batch_size=32):
    """
    Encode a list of text strings into embedding vectors using the cached model.

    Parameters
    ----------
    texts : list[str]
        The texts to encode (e.g. article titles + summaries).
    batch_size : int
        Number of texts per encoding batch. Defaults to 32 (as specified in
        Step 11.4 of the implementation plan).

    Returns
    -------
    numpy.ndarray
        2-D array of shape (len(texts), embedding_dim) containing L2-normalized
        embeddings ready for cosine-similarity computation.
    """
    model = get_model()
    return model.encode(
        texts,
        batch_size=batch_size,
        normalize_embeddings=True,   # pre-normalized -> dot product == cosine sim
        show_progress_bar=False,
    )
