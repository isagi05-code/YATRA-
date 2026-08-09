"""Small, dependency-free configuration helpers used by every API service."""
from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
ENV_FILE = BACKEND_DIR / '.env'

def load_environment() -> None:
    """Load settings from the root project .env (single source of truth).
    Falls back to backend/.env if it exists. Neither file is required.
    Already-set environment variables are never overridden.
    """
    # Root project .env is the primary config file — keeps backend clean
    root_env = PROJECT_DIR / '.env'
    _load_env_file(root_env)
    # Optional backend-local override (e.g. CI/CD secrets injection) — not created by default
    if ENV_FILE.exists():
        _load_env_file(ENV_FILE)


def _load_env_file(path: Path) -> None:
    """Load a single .env file into os.environ.
    Only sets a variable if it is not already set to a non-empty value,
    so real OS environment variables always win over .env files.
    """
    if not path.exists():
        return
    try:
        from dotenv import load_dotenv
        # override=True so empty strings in the environment get replaced by .env values
        load_dotenv(path, override=True)
        return
    except ImportError:
        pass
    for raw_line in path.read_text().splitlines():
        line = raw_line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, _, value = line.partition('=')
        k = key.strip()
        v = value.split('#', 1)[0].strip()
        # Only overwrite if the current value is absent or empty
        if not os.environ.get(k):
            os.environ[k] = v

load_environment()

def setting(name: str, default: str | None = None) -> str | None:
    return os.getenv(name, default)
