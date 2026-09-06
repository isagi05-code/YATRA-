import subprocess
import sys
import os
import uvicorn
from core.config import BACKEND_DIR, load_environment

load_environment()
BACKEND_DIR = str(BACKEND_DIR)

def run_server():
    print("=" * 60)
    print(" Starting VittAro Yatra Unified FastAPI Backend Server")
    print(" Host: http://127.0.0.1:8000")
    print(" Docs: http://127.0.0.1:8000/docs")
    print(" Database: MySQL (yatra_enterprise)")
    print("=" * 60)
    
    # Verify MySQL database exists, initialize if missing
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from mysql_helper import get_db_conn
    try:
        conn = get_db_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM users LIMIT 1")
        cursor.fetchone()
        conn.close()
    except Exception as e:
        print(f"Database not initialized ({e}). Running db_init.py...")
        subprocess.run([sys.executable, "db_init.py"], cwd=BACKEND_DIR)

    # Run single uvicorn server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=BACKEND_DIR
    )

if __name__ == "__main__":
    run_server()
