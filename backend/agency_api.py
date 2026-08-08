"""
agency_api.py — Agency Dashboard API Microservice (Port 8000).
Modularized FastAPI app mounting routers for Dashboard, Tours, Expenses, Fleet, Misc, and Auth.
"""
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modular routers
app.include_router(agency_dashboard_router)
app.include_router(agency_tours_router)
app.include_router(agency_expenses_router)
app.include_router(agency_fleet_router)
app.include_router(agency_misc_router)
app.include_router(auth_router)
