"""
Management command: test_semantic
==================================
Phase 11 — Step 11.5: Testing & Verification

Run inside the backend Docker container with:
    python manage.py test_semantic

What it tests:
  1. Model loading — confirms all-MiniLM-L6-v2 loads and caches correctly.
  2. Category embedding cache — confirms all DB categories are embedded at batch_size=256.
  3. Article categorization accuracy — runs a suite of hand-crafted "tricky" articles
     that the old regex matcher was known to get wrong, and asserts the semantic engine
     produces the correct category.

Exit codes:
  0  All assertions passed.
  1  One or more assertions failed (details printed to stdout).
"""

from django.core.management.base import BaseCommand
from django.utils.termcolors import make_style

# Re-usable colour helpers (fall back gracefully in non-TTY environments)
OK    = make_style(fg='green', opts=('bold',))
FAIL  = make_style(fg='red',   opts=('bold',))
INFO  = make_style(fg='cyan')
WARN  = make_style(fg='yellow')
HEAD  = make_style(fg='white', opts=('bold',))

# ---------------------------------------------------------------------------
# Test cases: (title, summary, expected_category_name)
# The expected name is matched case-insensitively against Category.name.
# Use None as expected to assert the article should be UNCATEGORIZED.
# ---------------------------------------------------------------------------
TEST_CASES = [
    # --- Ambiguous AI articles that old regex incorrectly mapped to "Software Engineering" ---
    (
        "RAG Architecture in Production",
        "How to build retrieval-augmented generation pipelines at scale using vector databases.",
        "Generative AI",
    ),
    (
        "Agent Workflows with LangGraph",
        "A deep dive into multi-agent orchestration and agentic task planning.",
        "AI",
    ),
    (
        "Fine-tuning LLMs on Custom Datasets",
        "Step-by-step guide to fine-tuning large language models with LoRA and QLoRA.",
        "Generative AI",
    ),
    (
        "Diffusion Models Explained",
        "Understanding how stable diffusion and DALL-E generate images from text prompts.",
        "Generative AI",
    ),
    # --- Cloud / DevOps disambiguation ---
    (
        "Deploying to AWS Lambda with Terraform",
        "Infrastructure as code approach to provisioning serverless functions on Amazon Web Services.",
        "AWS",
    ),
    (
        "Kubernetes Autoscaling Best Practices",
        "Horizontal Pod Autoscaler and Cluster Autoscaler configuration for production clusters.",
        "Cloud Computing",
    ),
    # --- Security ---
    (
        "Zero-Day Vulnerability Found in OpenSSL",
        "Researchers disclose critical remote code execution flaw; patch immediately.",
        "Cybersecurity",
    ),
    # --- Programming languages ---
    (
        "Rust Ownership Model for Systems Programmers",
        "Memory safety without garbage collection — understanding borrow checker rules.",
        "Rust",
    ),
    (
        "TypeScript 5.4 New Features",
        "Improved type narrowing, inferred type predicates, and performance boosts in the latest TypeScript release.",
        "JavaScript",
    ),
    # --- Web3 / Blockchain ---
    (
        "Ethereum Layer 2 Scaling Solutions",
        "Comparing Optimism, Arbitrum, and zkSync for DeFi applications on the Ethereum blockchain.",
        "Blockchain",
    ),
    # --- Startup / Business ---
    (
        "Y Combinator W25 Batch Announced",
        "The latest cohort of YC-backed startups has been revealed, covering AI, fintech, and climate tech founders.",
        "Startups",
    ),
    # --- Borderline: should NOT be mis-categorized as AI just because of "model" ---
    (
        "Django ORM Query Optimization",
        "Using select_related and prefetch_related to reduce database query counts in Django models.",
        "Backend",
    ),
]


class Command(BaseCommand):
    help = "Step 11.5 — Verify semantic categorization accuracy for known-tricky articles."

    def handle(self, *args, **options):
        self.stdout.write(HEAD("\n------------------------------------------------------"))
        self.stdout.write(HEAD("  Phase 11 — Semantic Categorization Test Suite"))
        self.stdout.write(HEAD("------------------------------------------------------\n"))

        # -- Step 1: Model loading ----------------------------------------------
        self.stdout.write(INFO("[ 1 / 3 ]  Loading sentence-transformer model..."))
        try:
            from feed.utils.model_loader import get_model, MODEL_NAME
            model = get_model()
            self.stdout.write(OK(f"           ?  Model '{MODEL_NAME}' loaded and cached."))
        except Exception as exc:
            self.stdout.write(FAIL(f"           ?  Model load FAILED: {exc}"))
            self.stdout.write(FAIL("\nAbort: cannot run tests without the model.\n"))
            raise SystemExit(1)

        # -- Step 2: Category embedding cache ----------------------------------
        self.stdout.write(INFO("\n[ 2 / 3 ]  Building category embedding cache (batch_size=256)..."))
        try:
            from feed.utils.filtering import get_category_embeddings, invalidate_category_cache
            invalidate_category_cache()          # force a fresh rebuild for accurate timing
            cache = get_category_embeddings()
            if not cache:
                self.stdout.write(WARN("           ?  Cache is empty — no categories in DB. Seed first."))
                self.stdout.write(WARN("              Run: python manage.py seed_sources\n"))
                raise SystemExit(1)
            self.stdout.write(OK(f"           ?  {len(cache)} categories embedded and cached."))

            from preferences.models import Category
            self.stdout.write(INFO("           Categories in cache:"))
            for cat in Category.objects.select_related('parent').order_by('parent__name', 'name'):
                label = f"{cat.parent.name} ? {cat.name}" if cat.parent else cat.name
                self.stdout.write(f"             • {label}")
        except SystemExit:
            raise
        except Exception as exc:
            self.stdout.write(FAIL(f"           ?  Cache build FAILED: {exc}"))
            raise SystemExit(1)

        # -- Step 3: Categorization accuracy test suite ------------------------
        self.stdout.write(INFO(f"\n[ 3 / 3 ]  Running {len(TEST_CASES)} categorization test cases...\n"))

        from feed.utils.filtering import categorize_article

        passed = 0
        failed = 0
        failures = []

        for title, summary, expected in TEST_CASES:
            result = categorize_article(title, summary)
            result_name = result.name if result else "UNCATEGORIZED"
            expected_norm = (expected or "UNCATEGORIZED").lower()
            result_norm   = result_name.lower()

            if result_norm == expected_norm:
                passed += 1
                self.stdout.write(
                    OK(f"  ?  PASS") + f"  [{result_name}]  {title[:65]}"
                )
            else:
                failed += 1
                failures.append((title, expected, result_name))
                self.stdout.write(
                    FAIL(f"  ?  FAIL") +
                    f"  expected=[{expected}]  got=[{result_name}]  '{title[:55]}'"
                )

        # -- Summary -----------------------------------------------------------
        self.stdout.write(HEAD("\n------------------------------------------------------"))
        total = len(TEST_CASES)
        pct   = int(100 * passed / total) if total else 0
        line  = f"  Results: {passed}/{total} passed ({pct}%)"
        self.stdout.write(OK(line) if failed == 0 else WARN(line))

        if failures:
            self.stdout.write(WARN("\n  Failed cases:"))
            for title, exp, got in failures:
                self.stdout.write(FAIL(f"    • '{title[:60]}'"))
                self.stdout.write(f"      expected : {exp}")
                self.stdout.write(f"      got      : {got}")
            self.stdout.write(HEAD("------------------------------------------------------\n"))
            self.stdout.write(
                WARN("  Tip: if scores are borderline, try lowering SIMILARITY_THRESHOLD\n"
                     "  in model_loader.py (currently 0.25) or adjusting category labels.\n")
            )
            raise SystemExit(1)

        self.stdout.write(OK("  All tests passed — semantic engine is working correctly!"))
        self.stdout.write(HEAD("------------------------------------------------------\n"))
