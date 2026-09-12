"""
filtering.py — Article categorization utilities.

Phase 11 additions (Step 11.3):
  - _category_embedding_cache  : module-level dict {category_id -> np.ndarray}
  - get_category_embeddings()  : builds / returns that cache using batch-256 encoding
  - invalidate_category_cache(): clears the cache (call after seeding new categories)

The original regex-based categorize_article() is kept unchanged and will be
replaced by the semantic version in Step 11.4.
"""

import re
import logging
import threading

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Step 11.3 — Category Embedding Cache
# ---------------------------------------------------------------------------

# {category_id (int): np.ndarray shape (384,)} — populated lazily on first call
_category_embedding_cache: dict = {}
_cache_lock = threading.Lock()
# Track which category IDs are cached so we can detect staleness
_cached_category_ids: set = set()

# Batch size for encoding ALL categories at once (Step 11.3 spec: 256)
CATEGORY_EMBED_BATCH_SIZE = 256


def _build_category_label(category) -> str:
    """
    Construct a descriptive text label for a category to encode.

    For a sub-category (has a parent) we include the parent name to give the
    model richer context, e.g.:
        parent="AI"  child="Generative AI"  →  "AI - Generative AI"
    For a top-level category we just use its name, e.g.:
        "Cloud Computing"
    """
    if category.parent_id:
        # parent name is accessible via the FK without an extra query when we
        # call select_related('parent') in get_category_embeddings()
        return f"{category.parent.name} - {category.name}"
    return category.name


def get_category_embeddings() -> dict:
    """
    Return (and lazily build) the module-level category embedding cache.

    3-tier lookup strategy
    ─────────────────────
    Tier 1 — in-memory cache (fastest):
        If _category_embedding_cache is already populated in this process,
        return it immediately with zero I/O.

    Tier 2 — database (fast, survives worker restarts):
        If every category already has an embedding stored in Category.embedding,
        load the vectors from the DB — no model inference needed.
        Rebuilds the in-memory cache from those stored vectors.

    Tier 3 — model inference (slow, first time only):
        For any category that has no stored embedding yet, run the
        sentence-transformer model and persist the result to Category.embedding
        so future worker startups use Tier 2 instead.

    Returns
    -------
    dict  {category_id: np.ndarray}  — L2-normalised vectors ready for
          cosine-similarity via dot product.
    """
    global _category_embedding_cache, _cached_category_ids

    # ── Tier 1: in-memory cache ───────────────────────────────────────────────
    if _category_embedding_cache:
        return _category_embedding_cache

    with _cache_lock:
        if _category_embedding_cache:   # double-checked locking
            return _category_embedding_cache

        try:
            import numpy as np  # noqa: PLC0415
            from preferences.models import Category  # noqa: PLC0415

            categories = list(Category.objects.select_related('parent').all())

            if not categories:
                logger.warning("[CategoryEmbeddings] No categories in DB — cache stays empty.")
                return {}

            # ── Tier 2: load existing embeddings from DB ──────────────────────
            cached_from_db   = {}   # id → np.ndarray for categories already in DB
            needs_embedding  = []   # Category objects with no stored embedding yet

            for cat in categories:
                if cat.embedding is not None:
                    cached_from_db[cat.id] = np.array(cat.embedding, dtype='float32')
                else:
                    needs_embedding.append(cat)

            if needs_embedding:
                # ── Tier 3: run model only for missing categories ─────────────
                from .model_loader import encode_texts  # noqa: PLC0415

                labels = [_build_category_label(cat) for cat in needs_embedding]

                logger.info(
                    "[CategoryEmbeddings] %d/%d categories missing embeddings — "
                    "running model (batch_size=%d)...",
                    len(needs_embedding), len(categories), CATEGORY_EMBED_BATCH_SIZE,
                )

                new_vecs = encode_texts(labels, batch_size=CATEGORY_EMBED_BATCH_SIZE)

                # Persist each new embedding back to the DB row
                for cat, vec in zip(needs_embedding, new_vecs):
                    cat.embedding = vec.tolist()   # JSON-serialisable Python list
                    cat.save(update_fields=['embedding'])
                    cached_from_db[cat.id] = vec
                    logger.debug(
                        "[CategoryEmbeddings] Saved embedding for category '%s' (id=%d).",
                        cat.name, cat.id,
                    )

                logger.info(
                    "[CategoryEmbeddings] %d new embeddings generated and saved to DB.",
                    len(needs_embedding),
                )
            else:
                logger.info(
                    "[CategoryEmbeddings] All %d category embeddings loaded from DB "
                    "(no model inference needed).",
                    len(categories),
                )

            # Populate in-memory cache from the combined result
            _category_embedding_cache = cached_from_db
            _cached_category_ids      = set(cached_from_db.keys())

            logger.info(
                "[CategoryEmbeddings] In-memory cache ready — %d categories.",
                len(_category_embedding_cache),
            )

        except Exception as exc:
            logger.error("[CategoryEmbeddings] Failed to build cache: %s", exc)
            return {}

    return _category_embedding_cache


def invalidate_category_cache(wipe_db: bool = False):
    """
    Clear the in-memory category embedding cache.

    Parameters
    ----------
    wipe_db : bool  (default False)
        If True, also sets Category.embedding = None for every row in the DB.
        Use this when:
          • The sentence-transformer model has been upgraded/swapped
          • Category names have been renamed (labels changed)
          • You want to force a full re-generation on next worker startup
        Leave False for a simple in-memory flush (e.g. after adding a new
        category — the new row will have embedding=None naturally, so Tier 3
        will handle it on next access without touching existing embeddings).
    """
    global _category_embedding_cache, _cached_category_ids
    with _cache_lock:
        _category_embedding_cache = {}
        _cached_category_ids = set()

    if wipe_db:
        try:
            from preferences.models import Category  # noqa: PLC0415
            updated = Category.objects.update(embedding=None)
            logger.info(
                "[CategoryEmbeddings] DB embeddings wiped for %d categories — "
                "will regenerate on next access.", updated,
            )
        except Exception as exc:
            logger.error("[CategoryEmbeddings] Failed to wipe DB embeddings: %s", exc)
    else:
        logger.info("[CategoryEmbeddings] In-memory cache invalidated — will reload from DB on next access.")


# ---------------------------------------------------------------------------
# Step 11.4 — Semantic Categorization (replaces keyword matching)
# ---------------------------------------------------------------------------

# Batch size for encoding incoming ARTICLE texts (Step 11.4 spec: 32)
ARTICLE_EMBED_BATCH_SIZE = 32


def categorize_article(title: str, summary: str):
    """
    Categorize a single article using semantic cosine similarity.

    Steps:
      1. Build a combined text from title + summary.
      2. Encode it into a normalized embedding vector via the cached model.
      3. Compute cosine similarity (dot product) against every cached category
         embedding from get_category_embeddings().
      4. Return the Category ORM object whose embedding has the highest
         similarity score, provided that score exceeds SIMILARITY_THRESHOLD.
         Returns None if no category clears the threshold (article left
         uncategorized rather than force-assigned a wrong category).

    Falls back to None (uncategorized) if the embedding cache or model is
    unavailable, so the fetcher task never crashes due to ML failures.

    Parameters
    ----------
    title   : str  Article headline.
    summary : str  Article body excerpt / summary.

    Returns
    -------
    preferences.models.Category | None
    """
    try:
        from .model_loader import encode_texts, SIMILARITY_THRESHOLD  # noqa: PLC0415

        category_embeddings = get_category_embeddings()
        if not category_embeddings:
            return None  # cache empty — graceful fallback

        text = f"{title} {summary}".strip()
        if not text:
            return None

        # Encode the single article text (still uses batch_size=32 under the hood)
        article_vec = encode_texts([text], batch_size=ARTICLE_EMBED_BATCH_SIZE)[0]

        # Compute cosine similarity via dot product (vectors are L2-normalised)
        best_id    = None
        best_score = -1.0

        for cat_id, cat_vec in category_embeddings.items():
            score = float(article_vec @ cat_vec)   # dot product == cosine sim
            if score > best_score:
                best_score = score
                best_id    = cat_id

        if best_id is None:
            logger.debug(
                "[Categorize] '%s...' → no confident match",
                title[:60]
            )
            return None

        # Fetch the matching Category object from DB
        from preferences.models import Category  # noqa: PLC0415
        matched = Category.objects.filter(id=best_id).first()

        logger.debug(
            "[Categorize] '%s...' → '%s' (score=%.3f)",
            title[:60], matched.name if matched else "?", best_score,
        )
        return matched

    except Exception as exc:
        logger.warning("[Categorize] Semantic categorization failed: %s — returning None.", exc)
        return None


def categorize_articles_batch(articles_data: list) -> list:
    """
    Categorize a batch of articles in a single model forward pass (batch_size=32).

    This is the preferred entry-point when processing many articles at once
    (e.g. inside the Celery fetch task) because it avoids calling the model
    N times and instead groups article texts into batches of 32 for efficient
    GPU/CPU utilisation.

    Parameters
    ----------
    articles_data : list[dict]
        List of dicts, each containing at least 'title' and 'summary' keys.

    Returns
    -------
    list[Category | None]
        Parallel list — result[i] is the matched Category for articles_data[i],
        or None if no category clears SIMILARITY_THRESHOLD.
    """
    if not articles_data:
        return []

    try:
        from .model_loader import encode_texts, SIMILARITY_THRESHOLD  # noqa: PLC0415
        from preferences.models import Category                         # noqa: PLC0415
        import numpy as np                                              # noqa: PLC0415

        category_embeddings = get_category_embeddings()
        if not category_embeddings:
            return [None] * len(articles_data)

        # Build combined texts for every article
        texts = [
            f"{a.get('title', '')} {a.get('summary', '')}".strip()
            for a in articles_data
        ]

        # Encode ALL article texts in batches of 32 (single call handles batching)
        article_vecs = encode_texts(texts, batch_size=ARTICLE_EMBED_BATCH_SIZE)

        # Stack category embeddings into a matrix [num_categories × dim]
        cat_ids   = list(category_embeddings.keys())
        cat_matrix = np.stack([category_embeddings[cid] for cid in cat_ids])  # (C, D)

        # Batch cosine similarity: (N, D) @ (D, C) = (N, C)
        sim_matrix  = article_vecs @ cat_matrix.T                              # (N, C)
        best_scores = sim_matrix.max(axis=1)                                   # (N,)
        best_idx    = sim_matrix.argmax(axis=1)                                # (N,)

        # Resolve category objects (one DB query for all unique IDs needed)
        unique_ids_needed = {
            cat_ids[int(idx)] for idx in best_idx
        }
        if unique_ids_needed:
            cat_map = {
                c.id: c for c in Category.objects.filter(id__in=unique_ids_needed)
            }
        else:
            cat_map = {}

        results = []
        for idx in best_idx:
            results.append(cat_map.get(cat_ids[int(idx)]))

        return results

    except Exception as exc:
        logger.warning(
            "[CategorizeBatch] Batch semantic categorization failed: %s — returning None for all.",
            exc,
        )
        return [None] * len(articles_data)
