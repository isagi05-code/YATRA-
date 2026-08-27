"""
auth_api.py — Central Authentication & Authorization Microservice (Port 8003).
Modularized FastAPI app mounting the auth router.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth_router

app = FastAPI(title="Yatra Auth API", version="2.0.0", description="Centralized Auth & Authorization")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
