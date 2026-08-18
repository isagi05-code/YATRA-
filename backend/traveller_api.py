"""
traveller_api.py — Traveller Dashboard API Microservice (Port 8001).
Modularized FastAPI app mounting routers for Traveller features and Auth.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.traveller.router import router as traveller_router
from modules.auth.router import router as auth_router

app = FastAPI(title="Yatra Traveller Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(traveller_router)
app.include_router(auth_router)
