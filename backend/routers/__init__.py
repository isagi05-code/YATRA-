"""Routers package for Yatra API microservices."""
from .agency_dashboard import router as agency_dashboard_router
from .agency_tours import router as agency_tours_router
from .agency_expenses import router as agency_expenses_router
from .agency_fleet import router as agency_fleet_router
from .agency_misc import router as agency_misc_router
from .traveller_router import router as traveller_router
from .team_admin import router as team_admin_router
from .auth_router import router as auth_router

__all__ = [
    "agency_dashboard_router",
    "agency_tours_router",
    "agency_expenses_router",
    "agency_fleet_router",
    "agency_misc_router",
    "traveller_router",
    "team_admin_router",
    "auth_router",
]
