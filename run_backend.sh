#!/bin/bash
# Convenient script to start Yatra Backend services using the project virtual environment

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/.venv/bin/python" "$SCRIPT_DIR/backend/run_backend.py"
