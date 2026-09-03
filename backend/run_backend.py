import subprocess
import sys
import time
import os
from core.config import BACKEND_DIR, load_environment

load_environment()
BACKEND_DIR = str(BACKEND_DIR)

def run_servers():
    print("Starting all Yatra AI FastAPI backend services...")
    
    # Check if MySQL databases exist and connect successfully. Initialize if missing.
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from mysql_helper import get_db_conn
    db_missing = False
    for db_name in ["yatra_agency", "yatra_traveller", "yatra_team"]:
        try:
            conn = get_db_conn(db_name)
            conn.close()
        except Exception:
            db_missing = True
            break
            
    if db_missing:
        print("MySQL databases not found or incomplete. Initializing databases first...")
        subprocess.run([sys.executable, "db_init.py"], cwd=BACKEND_DIR)
        
    processes = []
    
    # Server configs
    servers = [
        {"name": "Agency Dashboard API", "command": [sys.executable, "-m", "uvicorn", "agency_api:app", "--port", "8000", "--host", "0.0.0.0", "--reload"]},
        {"name": "Traveller Dashboard API", "command": [sys.executable, "-m", "uvicorn", "traveller_api:app", "--port", "8001", "--host", "0.0.0.0", "--reload"]},
        {"name": "Yatra Team Admin API", "command": [sys.executable, "-m", "uvicorn", "team_api:app", "--port", "8002", "--host", "0.0.0.0", "--reload"]},
        {"name": "Auth & Authorization API", "command": [sys.executable, "-m", "uvicorn", "auth_api:app", "--port", "8003", "--host", "0.0.0.0", "--reload"]},
    ]
    
    try:
        for s in servers:
            print(f"Launching {s['name']} on http://localhost:{s['command'][6]} ...")
            # We run uvicorn as a subprocess. We don't pipe stdout so the uvicorn logs output directly to terminal.
            p = subprocess.Popen(s["command"], env=os.environ.copy(), cwd=BACKEND_DIR)
            processes.append(p)
            # Short sleep to prevent port collision race conditions
            time.sleep(0.5)
            
        print("\nAll backend services launched successfully! Press Ctrl+C to terminate all servers.")
        
        # Keep the main process alive
        while True:
            time.sleep(1)
            # Monitor if any process died
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"\n[Warning] {servers[i]['name']} exited with code {p.returncode}")
                    sys.exit(1)
                    
    except KeyboardInterrupt:
        print("\nKeyboardInterrupt received. Shutting down all backend services...")
    finally:
        for p in processes:
            if p.poll() is None:
                p.terminate()
                p.wait()
        print("All servers cleanly terminated.")

if __name__ == "__main__":
    run_servers()
