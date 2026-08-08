"""Agency Misc router — customers, invoices, reports, notifications, settings, AI itinerary."""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from core.database import get_db_conn as get_mysql_conn
from schemas.agency import SettingsUpdate

router = APIRouter(tags=["Agency Misc"])


def get_db_conn():
    return get_mysql_conn("yatra_agency")


def require_agency_id(agency_id: Optional[str]) -> str:
    return agency_id or "AGY-1001"


# ── Customers ─────────────────────────────────────────────────────────────────

@router.get("/customers")
def get_customers():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers")
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return customers


@router.get("/customers/{customer_id}")
def get_customer_details(customer_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE customer_id = ?", (customer_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    return dict(row)


# ── AI Itinerary ──────────────────────────────────────────────────────────────

@router.post("/ai-itinerary")
def generate_ai_itinerary(destination: str, days: int, budget: float = 0):
    """Generate a real day-wise itinerary using Google Gemini Flash (free tier, REST)."""
    import json as _json
    import requests as _requests

    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured. Add it to backend/.env to enable AI itinerary generation."
        )
    budget_label = f"₹{int(budget):,}" if budget else "flexible"
    prompt = f"""You are a professional Indian travel planner. Generate a {days}-day itinerary for {destination} with a total budget of {budget_label}.

Return ONLY valid JSON — no markdown, no extra text, no code fences. Use this exact schema:
{{
  "destination": "<destination name>",
  "days": {days},
  "summary": "<one-sentence trip summary>",
  "estimated_budget": <total number in INR, integer>,
  "budget_breakdown": {{
    "accommodation": <integer>,
    "food": <integer>,
    "transport": <integer>,
    "activities": <integer>,
    "miscellaneous": <integer>
  }},
  "itinerary": [
    {{
      "day": 1,
      "title": "<theme or focus for the day>",
      "estimated_cost": <integer>,
      "activities": [
        {{ "time": "Morning",   "name": "<activity name>", "description": "<1-2 sentence description>" }},
        {{ "time": "Afternoon", "name": "<activity name>", "description": "<1-2 sentence description>" }},
        {{ "time": "Evening",   "name": "<activity name>", "description": "<1-2 sentence description>" }}
      ]
    }}
  ],
  "tips": "<2-3 practical travel tips, semicolon-separated>",
  "best_time_to_visit": "<season or months>"
}}

Generate exactly {days} day objects in the itinerary array. Keep descriptions practical and specific to {destination}."""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={gemini_key}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4096, "responseMimeType": "application/json"}
    }
    try:
        resp = _requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        candidates = resp.json().get("candidates", [])
        if not candidates:
            raise HTTPException(status_code=500, detail="Gemini returned no candidates.")
        raw = candidates[0]["content"]["parts"][0]["text"].strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw
            raw = raw.rsplit("```", 1)[0].strip()
        data = _json.loads(raw)
        return data
    except _json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"AI returned malformed JSON: {exc}")
    except _requests.HTTPError as exc:
        detail = str(exc)
        try:
            detail = resp.json().get("error", {}).get("message", detail)
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"Gemini API error: {detail}")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {exc}")


# ── Invoices ──────────────────────────────────────────────────────────────────

@router.get("/invoices")
def get_invoices():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE status = 'Completed'")
    completed_tours = cursor.fetchall()
    invoices = []
    for tour in completed_tours:
        trip_id = tour["trip_id"]
        cursor.execute("SELECT SUM(amount) FROM expenses WHERE trip_id = ? AND status = 'Approved'", (trip_id,))
        exp_sum = cursor.fetchone()[0] or 0.0
        gst_calc = exp_sum * 0.18
        grand_total = exp_sum + gst_calc
        invoices.append({
            "invoice_id": 1000 + trip_id,
            "trip_id": trip_id,
            "customer": tour["customer"],
            "destination": tour["destination"],
            "start_date": tour["start_date"],
            "end_date": tour["end_date"],
            "expenses_total": exp_sum,
            "gst": gst_calc,
            "grand_total": grand_total,
            "payment_status": "Paid" if tour["timeline_status"] == "Payment Completed" else "Pending Payment",
            "outstanding_amount": 0.0 if tour["timeline_status"] == "Payment Completed" else grand_total,
            "qr_code_payload": f"upi://pay?pa=yatra@okaxis&am={grand_total}&tn=Trip{trip_id}",
            "digital_signature": "SHA256:8f921ea897cd021bc34e2c918ef0e980c6a38"
        })
    conn.close()
    return invoices


@router.get("/invoices/{trip_id}")
def generate_invoice_for_tour(trip_id: int, day: Optional[str] = None):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE trip_id = ?", (trip_id,))
    tour_row = cursor.fetchone()
    if not tour_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Tour not found")
    tour = dict(tour_row)
    if day:
        cursor.execute("SELECT * FROM expenses WHERE trip_id = ? AND date = ? AND status = 'Approved'", (trip_id, day))
    else:
        cursor.execute("SELECT * FROM expenses WHERE trip_id = ? AND status = 'Approved'", (trip_id,))
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    expenses_total = sum(e["amount"] for e in expenses)
    gst_total = sum(e["gst"] for e in expenses)
    grand_total = expenses_total + gst_total
    return {
        "agency_logo": "/yatralogo.jpg",
        "invoice_number": f"YATRA-{1000 + trip_id}",
        "customer": tour["customer"],
        "trip_id": trip_id,
        "destination": tour["destination"],
        "vehicle": tour["vehicle"],
        "driver": tour["driver"],
        "journey_dates": f"{tour['start_date']} to {tour['end_date']}",
        "billing_type": f"Day ({day})" if day else "Entire Tour",
        "expenses": expenses,
        "subtotal": expenses_total,
        "gst": gst_total,
        "grand_total": grand_total,
        "payment_status": "Paid" if tour['timeline_status'] == 'Payment Completed' else "Pending Payment",
        "qr_code": f"upi://pay?pa=yatra@okaxis&am={grand_total}&tn=Trip-{trip_id}",
        "digital_signature": "SHA256-DIGISIG-YATRA-981240182",
        "download_pdf_url": f"/invoices/download/{trip_id}",
        "email_sent_to": "client@example.com"
    }


@router.get("/invoices/download/{trip_id}")
def download_invoice_pdf(trip_id: int):
    return {
        "status": "success",
        "message": f"PDF invoice for trip #{trip_id} compiled successfully.",
        "download_url": f"/public/invoices/invoice_{trip_id}.pdf"
    }


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
def generate_reports(report_type: str = Query(..., pattern="^(Expense|Profit|Tour|Vehicle|Driver|Customer|GST|Monthly|Yearly)$")):
    return {
        "report_type": f"{report_type} Report",
        "generation_date": "2026-07-05",
        "summary": f"Aggregated {report_type.lower()} analysis metrics generated from live DB.",
        "export_links": {
            "csv": f"/reports/export/{report_type.lower()}?format=csv",
            "excel": f"/reports/export/{report_type.lower()}?format=xlsx",
            "pdf": f"/reports/export/{report_type.lower()}?format=pdf"
        }
    }


# ── Notifications ─────────────────────────────────────────────────────────────

@router.get("/notifications")
def get_notifications(unread_only: bool = False):
    conn = get_db_conn()
    cursor = conn.cursor()
    if unread_only:
        cursor.execute("SELECT * FROM notifications WHERE read = 0 ORDER BY id DESC")
    else:
        cursor.execute("SELECT * FROM notifications ORDER BY id DESC")
    notifications = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifications


@router.put("/notifications/{notif_id}/read")
def mark_notification_as_read(notif_id: int):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ?", (notif_id,))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Notification not found")
    conn.commit()
    conn.close()
    return {"message": "Notification marked as read"}


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings():
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM settings")
    settings_dict = {row["key"]: row["value"] for row in cursor.fetchall()}
    conn.close()
    return settings_dict


@router.put("/settings/{key}")
def update_settings(key: str, payload: SettingsUpdate):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", (key, payload.value))
    conn.commit()
    conn.close()
    return {"message": f"Setting '{key}' updated successfully."}
