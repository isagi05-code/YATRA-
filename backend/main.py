"""
main.py — Unified Yatra ERP FastAPI Application.
Consolidates Agency, Traveller, Team Admin, and Authentication services into a single server.
Runs on Port 8000 connected directly to single database: yatra_enterprise.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth_router,
    agency_dashboard_router,
    agency_tours_router,
    agency_expenses_router,
    agency_fleet_router,
    agency_misc_router,
    traveller_router,
    team_admin_router,
)

app = FastAPI(
    title="VittAro Yatra ERP Unified API",
    description="Unified backend API serving Agency, Traveller, and Team Admin portals connected to MySQL (yatra_enterprise).",
    version="2.0.0"
)

# CORS Configuration
_FRONTEND_ORIGIN = os.environ.get("FRONTEND_URL", "http://localhost:5173")
_ALLOWED_ORIGINS = [
    _FRONTEND_ORIGIN,
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# ─── Mount Modular Routers ───────────────────────────────────────────────────
# Authentication & Identity
app.include_router(auth_router)

# Agency Portal Routers
app.include_router(agency_dashboard_router)
app.include_router(agency_tours_router)
app.include_router(agency_expenses_router)
app.include_router(agency_fleet_router)
app.include_router(agency_misc_router)

# Traveller Portal Router (prefixed with /traveller)
app.include_router(traveller_router)

# Team Admin Portal Router (prefixed with /team)
app.include_router(team_admin_router)


@app.get("/health", tags=["System"])
def health_check():
    """System health check endpoint verifying database connectivity."""
    from mysql_helper import get_db_conn
    db_status = "healthy"
    try:
        conn = get_db_conn("yatra_enterprise")
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        conn.close()
    except Exception as e:
        db_status = f"unhealthy: {e}"

    return {
        "status": "ok" if db_status == "healthy" else "degraded",
        "service": "VittAro Yatra Unified API",
        "database": db_status,
        "database_name": "yatra_enterprise",
        "port": 8000
    }


@app.get("/", tags=["System"])
def root():
    return {
        "message": "VittAro Yatra Unified API Server is online",
        "docs": "/docs",
        "health": "/health"
    }
