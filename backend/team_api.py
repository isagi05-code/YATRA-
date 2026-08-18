"""
team_api.py — Yatra Team Admin API Microservice (Port 8002).
Modularized FastAPI app mounting routers for Platform Management and Auth.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.team_admin.router import router as team_admin_router
from modules.auth.router import router as auth_router

app = FastAPI(title="Yatra Team Admin API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(team_admin_router)
app.include_router(auth_router)
