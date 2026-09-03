"""
agency_api.py — Agency Dashboard API Microservice (Port 8000).
Modularized FastAPI app mounting routers for Dashboard, Tours, Expenses, Fleet, Misc, and Auth.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    agency_dashboard_router,
    agency_tours_router,
    agency_expenses_router,
    agency_fleet_router,
    agency_misc_router,
    auth_router,
)

app = FastAPI(title="Yatra Agency Dashboard API", version="2.0.0")

# CORS: allow the Vite frontend (localhost:5173 dev + any HTTPS origin in production)
# Do NOT use allow_origin_regex=r"http://.*" — that permits all HTTP origins including attacker sites
_FRONTEND_ORIGIN = os.environ.get("FRONTEND_URL", "http://localhost:5173")
_ALLOWED_ORIGINS = [
    _FRONTEND_ORIGIN,
    "http://localhost:5174",  # Vite fallback port
    "http://localhost:3000",  # CRA fallback
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Include modular routers
app.include_router(agency_dashboard_router)
app.include_router(agency_tours_router)
app.include_router(agency_expenses_router)
app.include_router(agency_fleet_router)
app.include_router(agency_misc_router)
app.include_router(auth_router)
