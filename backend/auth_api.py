"""
auth_api.py — Central Authentication & Authorization Microservice (Port 8003).
Modularized FastAPI app mounting the auth router.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth_router

app = FastAPI(title="Yatra Auth API", version="2.0.0", description="Centralized Auth & Authorization")

_FRONTEND_ORIGIN = os.environ.get("FRONTEND_URL", "http://localhost:5173")
_ALLOWED_ORIGINS = [
    _FRONTEND_ORIGIN,
    "http://localhost:5174",
    "http://localhost:3000",
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

app.include_router(auth_router)
