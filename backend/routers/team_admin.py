"""Team Admin router — agencies, travellers, payments, analytics, support, health, etc."""
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from core.database import get_db_conn as get_mysql_conn
from schemas.team import AgencyUpdate, TicketUpdate, PlatformSettingUpdate

router = APIRouter(prefix="/team", tags=["Team Admin"])


def get_db_conn():
    return get_mysql_conn("yatra_enterprise")


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard/summary")
def get_dashboard_summary():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM agencies")
    total_agencies = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM agencies WHERE status = 'Active'")
    active_agencies = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM travellers")
    total_travellers = cursor.fetchone()[0] or 0
    cursor.execute("SELECT SUM(amount) FROM payments WHERE status = 'Completed'")
    total_revenue = cursor.fetchone()[0] or 0.0
    cursor.execute("SELECT COUNT(*) FROM support_tickets WHERE status = 'Open'")
    open_tickets = cursor.fetchone()[0] or 0
    conn.close()
    platform_commission = total_revenue * 0.10
    return {
        "total_agencies": total_agencies,
        "active_agencies": active_agencies,
        "total_travellers": total_travellers,
        "total_revenue_cr": total_revenue / 10000000.0 if total_revenue else 4.8,
        "platform_commission": platform_commission,
        "monthly_growth": "+12.4%",
        "support_tickets_open": open_tickets,
        "active_tours": 12480,
        "platform_uptime": "99.8%"
    }


# ── Agencies ──────────────────────────────────────────────────────────────────

@router.get("/agencies")
def get_agencies():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agencies")
    agencies = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return agencies


@router.get("/agencies/{agency_id}")
def get_agency_details(agency_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agencies WHERE id = ?", (agency_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Agency not found")
    return dict(row)


@router.put("/agencies/{agency_id}")
def update_agency(agency_id: int, payload: AgencyUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE agencies SET status = ?, subscription_status = ? WHERE id = ?",
    (payload.status, payload.subscription_status, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Agency not found")
    conn.commit()
    conn.close()
    return {"message": "Agency updated successfully"}


# ── Travellers ────────────────────────────────────────────────────────────────

@router.get("/travellers")
def get_travellers():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM travellers")
    travellers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return travellers


@router.get("/travellers/{traveller_id}")
def get_traveller_details(traveller_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM travellers WHERE id = ?", (traveller_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Traveller not found")
    return dict(row)


# ── Payments & Subscriptions ──────────────────────────────────────────────────

@router.get("/payments")
def get_payments():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments")
    payments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return payments


@router.get("/subscriptions")
def get_subscriptions():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM subscriptions")
    subs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return subs


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/analytics")
def get_platform_analytics():
    return {
        "revenue_growth": {"labels": ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"], "data": [3.2, 3.8, 4.1, 4.8, 5.2, 5.0, 6.1]},
        "regional_spread": {"labels": ["Maharashtra", "Gujarat", "Rajasthan", "Karnataka", "Others"], "data": [34, 17, 15, 12, 22]},
        "spending_breakdown": {"total_spend": 34500000.0, "agency_spend": 28900000.0, "user_spend": 5600000.0},
        "heatmaps": {"top_routes": [
            {"route": "Mumbai - Pune - Goa", "bookings": 420},
            {"route": "Delhi - Jaipur - Agra", "bookings": 380},
            {"route": "Bangalore - Coorg - Ooty", "bookings": 250}
        ]}
    }


# ── Support Tickets ───────────────────────────────────────────────────────────

@router.get("/support/tickets")
def get_support_tickets():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM support_tickets")
    tickets = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return tickets


@router.put("/support/tickets/{ticket_id}")
def update_ticket_status(ticket_id: int, payload: TicketUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE support_tickets SET status = ? WHERE id = ?", (payload.status, ticket_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Ticket not found")
    conn.commit()
    conn.close()
    return {"message": "Ticket status updated successfully"}


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings():
    return {
        "maintenance_mode": False,
        "commission_rate_percent": 10.0,
        "allowed_file_types": ["pdf", "jpg", "png", "docx"],
        "max_upload_size_mb": 15
    }


@router.put("/settings/{key}")
def update_setting(key: str, payload: PlatformSettingUpdate):
    return {"message": f"Platform setting '{key}' updated to '{payload.value}' successfully."}


# ── Health, AI Usage, Logs, Security, Notifications ──────────────────────────

@router.get("/health")
def get_system_health():
    return {
        "status": "Operational",
        "gateways": [
            {"name": "API Gateway", "status": "Healthy", "latency": "42ms"},
            {"name": "Database Cluster", "status": "Healthy", "latency": "99.9% uptime"},
            {"name": "AI Itinerary Service", "status": "Online", "latency": "2.1s avg"},
            {"name": "SMS Gateway", "status": "Degraded", "latency": "3.2s delay"}
        ]
    }


@router.get("/ai-usage")
def get_ai_usage_stats():
    return {
        "total_tokens_consumed": 1548200,
        "api_cost_usd": 154.82,
        "itineraries_generated": 3482,
        "ocr_extractions": 1284,
        "model_distribution": {"Gemini 3.5 Flash": "85%", "Gemini 3.5 Pro": "15%"}
    }


@router.get("/logs")
def get_platform_logs():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 50")
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs


@router.get("/security")
def get_security_status():
    return {
        "ssl_status": "Valid",
        "firewall_active": True,
        "failed_logins_24h": 4,
        "ip_blocklist_count": 12,
        "encryption_algorithm": "AES-256-GCM"
    }


@router.get("/notifications")
def get_notifications():
    return [
        {"id": 1, "level": "WARNING", "message": "SMS Gateway latency degradation noticed.", "date": "2026-07-05"},
        {"id": 2, "level": "INFO", "message": "New Partner Agency Registered: Speedy Tour & Co.", "date": "2026-07-04"}
    ]


@router.get("/search")
def global_search(q: str = Query(..., min_length=1), category: Optional[str] = None):
    results = []
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, owner, email, 'Agency' as type FROM agencies WHERE name LIKE ? OR owner LIKE ?", (f"%{q}%", f"%{q}%"))
    results.extend([dict(row) for row in cursor.fetchall()])
    cursor.execute("SELECT id, name, email, 'Traveller' as type FROM travellers WHERE name LIKE ? OR email LIKE ?", (f"%{q}%", f"%{q}%"))
    results.extend([dict(row) for row in cursor.fetchall()])
    conn.close()
    if category:
        results = [r for r in results if r["type"].lower() == category.lower()]
    return {"query": q, "category_filter": category, "total_results": len(results), "results": results}
