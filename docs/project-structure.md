# YATRA project structure

This document defines the project’s stable organization while the legacy large files are incrementally split.

## Source of truth

| Area | Location | Responsibility |
| --- | --- | --- |
| Web client | `frontend/` | Vite application and design system |
| Frontend API client | `frontend/src/services/api.js` | All browser-to-API requests |
| Shared UI | `frontend/src/components/ui/` | Buttons, cards, forms, tables, modal, empty/loading states |
| Agency feature | `frontend/src/portals/AgencyPortal/` | Agency-only pages, local components, chart helpers |
| Services | `backend/*_api.py` | One FastAPI app per public service/port |
| Auth and infrastructure | `backend/auth_*.py`, `backend/*_helper.py` | Tokens, authorization, mail/SMS, database helpers |
| Database setup | `backend/db_init.py`, `backend/mysql_schema.sql` | Local schema and bootstrap |

## Incremental refactor direction

The service files are intentionally left in their current locations until each has test coverage. New server code should be grouped by responsibility before these files are split:

```text
backend/
├── routers/       # FastAPI route declarations
├── services/      # business rules and external integrations
├── repositories/  # MySQL queries
├── schemas/       # Pydantic request/response types
└── core/          # configuration, auth, database setup
```

This keeps existing imports and `uvicorn agency_api:app` entry points working while reducing risk.

## Frontend feature convention

Each portal feature may contain:

```text
Feature/
├── FeaturePage.jsx       # page composition and data loading
├── components/           # feature-only UI
├── utils/                # pure mapping/formatting helpers
└── index.js              # optional public exports
```

Use `frontend/src/components/ui/` for anything shared by two or more features. Do not add new inline style objects; use the shared CSS tokens and component classes instead.

## Canonical commands

Use scripts in `scripts/` rather than the older duplicate root launch files. The older files remain temporarily for backward compatibility.
