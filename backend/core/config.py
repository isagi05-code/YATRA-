"""Small, dependency-free configuration helpers used by every API service."""
from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
ENV_FILE = BACKEND_DIR / '.env'

def load_environment() -> None:
    """Load local backend settings once without overriding exported environment values."""
    if not ENV_FILE.exists():
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(ENV_FILE)
        return
    except ImportError:
        pass
    for raw_line in ENV_FILE.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, value = line.partition('=')
        os.environ.setdefault(key.strip(), value.split('#', 1)[0].strip())

load_environment()

def setting(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)
