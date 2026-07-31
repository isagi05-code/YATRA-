#!/bin/bash
# Run backend from inside backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"$SCRIPT_DIR/../.venv/bin/python" "$SCRIPT_DIR/run_backend.py"
