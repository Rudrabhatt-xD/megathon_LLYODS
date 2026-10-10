"""Root conftest: puts the repository root on sys.path so `greenhome`, `api` and `scripts` import."""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Tests never call a real LLM unless explicitly marked live_llm.
os.environ.setdefault("LLM_PROVIDER", "template")
