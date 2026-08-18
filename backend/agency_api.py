"""
agency_api.py — Agency Dashboard API Microservice (Port 8000).
Modularized FastAPI app mounting routers for Dashboard, Tours, Expenses, Fleet, Misc, and Auth.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.agency.dashboard.router import router as agency_dashboard_router
from modules.agency.tours.router import router as agency_tours_router
from modules.agency.expenses.router import router as agency_expenses_router
from modules.agency.fleet.router import router as agency_fleet_router
from modules.agency.misc.router import router as agency_misc_router
from modules.auth.router import router as auth_router
from modules.tracking.router import router as tracking_router

app = FastAPI(title="Yatra Agency Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*",
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
app.include_router(tracking_router)
