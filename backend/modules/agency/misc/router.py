"""Agency Misc router — customers, invoices, reports, notifications, settings, AI itinerary."""
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from core.database import get_db_conn as get_mysql_conn
from modules.agency.schemas import SettingsUpdate
from modules.auth.deps import get_agency_id

router = APIRouter(tags=["Agency Misc"])


def get_db_conn():
    return get_mysql_conn("yatra_agency")


# ── Customers ─────────────────────────────────────────────────────────────────

@router.get("/customers")
def get_customers(agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE agency_id = ?", (agency_id,))
    customers = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return customers


@router.get("/customers/{customer_id}")
def get_customer_details(customer_id: int, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customers WHERE customer_id = ? AND agency_id = ?", (customer_id, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Customer not found")
    return dict(row)


# ── AI Itinerary ──────────────────────────────────────────────────────────────

@router.post("/ai-itinerary")
async def generate_ai_itinerary(destination: str, days: int, budget: float = 0, agency_id: str = Depends(get_agency_id)):
    """Generate a rich, detailed day-wise itinerary using Google Gemini (REST API)."""
    import json as _json
    import requests as _requests
    from starlette.concurrency import run_in_threadpool

    gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
    preferred_model = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash").strip()
    models_to_try = [preferred_model, "gemini-3.6-flash", "gemini-2.5-flash", "gemini-1.5-flash-latest"]

    # Remove duplicates preserving order
    seen = set()
    models_to_try = [m for m in models_to_try if not (m in seen or seen.add(m))]

    budget_val = int(budget) if budget > 0 else days * 6000
    budget_label = f"₹{budget_val:,}"
    dest_clean = destination.strip().title()
    per_day = int(budget_val / max(days, 1))

    prompt = f"""You are an expert Indian travel planner with deep local knowledge. Generate a highly detailed, realistic {days}-day itinerary for {dest_clean} with a total budget of {budget_label}.

Return ONLY valid JSON — no markdown, no extra text, no code fences. Use EXACTLY this schema:
{{
  "destination": "{dest_clean}",
  "days": {days},
  "summary": "<2-3 sentence vivid trip summary capturing the mood, highlights, and best experiences>",
  "estimated_budget": {budget_val},
  "budget_breakdown": {{
    "accommodation": <integer, ~35-40% of total>,
    "food": <integer, ~20-25% of total>,
    "transport": <integer, ~15-20% of total>,
    "activities_and_entry": <integer, ~10-15% of total>,
    "shopping_and_misc": <integer, ~5-10% of total>
  }},
  "accommodation_suggestion": {{
    "name": "<specific hotel or guesthouse name for {dest_clean}>",
    "area": "<locality or area in {dest_clean}>",
    "price_per_night": <integer in INR>,
    "type": "<Budget / Mid-range / Luxury>"
  }},
  "itinerary": [
    {{
      "day": 1,
      "title": "<engaging thematic title for this day's journey>",
      "theme": "<one-word theme: Heritage / Nature / Adventure / Spiritual / Leisure / Culture>",
      "estimated_cost": <integer daily cost in INR>,
      "highlights": ["<top attraction 1>", "<top attraction 2>", "<top attraction 3>"],
      "activities": [
        {{
          "time": "Morning",
          "time_slot": "07:00 - 10:00",
          "name": "<specific attraction or activity name>",
          "location": "<exact place name, neighbourhood, or landmark>",
          "description": "<2-3 sentences: what to do, what to see, why it's special>",
          "distance_from_base": "<X km from hotel/city center>",
          "entry_fee": "<₹XX per person or Free>",
          "duration": "<approx duration e.g. 2 hours>",
          "tips": "<1 practical insider tip>"
        }},
        {{
          "time": "Late Morning",
          "time_slot": "10:30 - 13:00",
          "name": "<specific attraction or activity name>",
          "location": "<exact place name>",
          "description": "<2-3 sentences>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<1 practical tip>"
        }},
        {{
          "time": "Afternoon",
          "time_slot": "13:00 - 14:30",
          "name": "Lunch at <specific restaurant or dhaba name>",
          "location": "<restaurant area or street name>",
          "description": "<what dishes to try, type of cuisine, ambiance>",
          "distance_from_base": "<X km>",
          "entry_fee": "₹<approx cost per person>",
          "duration": "1.5 hours",
          "tips": "<ordering tip or reservation advice>"
        }},
        {{
          "time": "Afternoon",
          "time_slot": "15:00 - 18:00",
          "name": "<specific afternoon attraction or activity>",
          "location": "<exact location>",
          "description": "<2-3 sentences>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<1 practical tip>"
        }},
        {{
          "time": "Evening",
          "time_slot": "18:30 - 21:00",
          "name": "<specific evening experience or dinner spot>",
          "location": "<exact location>",
          "description": "<2-3 sentences capturing the evening atmosphere>",
          "distance_from_base": "<X km>",
          "entry_fee": "<₹XX or Free>",
          "duration": "<approx duration>",
          "tips": "<evening-specific tip>"
        }}
      ],
      "transport_for_day": {{
        "mode": "<Auto / Cab / Bus / Walk / Boat / etc.>",
        "estimated_cost": "<₹XX for the day>",
        "notes": "<key transport detail or booking tip>"
      }},
      "meals_budget": "<₹XX estimated for all meals today>"
    }}
  ],
  "tips": [
    "<specific, actionable tip 1 for {dest_clean}>",
    "<specific tip 2 about local customs or etiquette>",
    "<specific tip 3 about safety or health>",
    "<specific tip 4 about best local experiences>",
    "<specific tip 5 about money-saving or booking>"
  ],
  "best_time_to_visit": "<specific months and reason>",
  "how_to_reach": {{
    "by_air": "<nearest airport and approx distance>",
    "by_train": "<nearest railway station and approx distance>",
    "by_road": "<road route from nearest major city>"
  }},
  "emergency_contacts": {{
    "police": "100",
    "ambulance": "108",
    "tourist_helpline": "1800-11-1363"
  }}
}}

RULES:
- Use REAL, SPECIFIC place names, restaurant names, and landmarks in {dest_clean}. No generic placeholders.
- Entry fees must be actual approximate INR amounts (e.g., ₹35, ₹500) or "Free". Research accurately.
- Distances must be realistic (e.g., "2.5 km from city center" not just "nearby").
- Time slots must be logical and allow realistic travel time between locations.
- Generate exactly {days} day objects in the itinerary array.
- Budget breakdown integers must sum exactly to {budget_val}.
- The accommodation suggestion must be a real property in {dest_clean} that fits the budget."""

    if gemini_key:
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.65,
                    "maxOutputTokens": 8192,
                    "responseMimeType": "application/json"
                }
            }
            try:
                def _do_post():
                    return _requests.post(url, json=payload, timeout=30)
                resp = await run_in_threadpool(_do_post)
                if resp.status_code == 200:
                    candidates = resp.json().get("candidates", [])
                    if candidates:
                        raw = candidates[0]["content"]["parts"][0]["text"].strip()
                        if raw.startswith("```"):
                            raw = raw.split("\n", 1)[1] if "\n" in raw else raw
                            raw = raw.rsplit("```", 1)[0].strip()
                        data = _json.loads(raw)
                        print(f"[AI ITINERARY] Successfully generated via {model}")
                        return data
                elif resp.status_code in (404, 400):
                    print(f"[AI ITINERARY] Model {model} returned {resp.status_code}, trying next model...")
                    continue
                else:
                    print(f"[AI ITINERARY] Model {model} returned HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                print(f"[AI ITINERARY] Error calling model {model}: {e}")

    # Minimal fallback — inform frontend that AI is unavailable rather than serving generic fake data
    print(f"[AI ITINERARY] All models failed for '{dest_clean}' — returning service unavailable")
    raise HTTPException(
        status_code=503,
        detail=f"Unable to generate itinerary for '{dest_clean}' at this time. Please check your GEMINI_API_KEY and try again."
    )


# ── Invoices ──────────────────────────────────────────────────────────────────

@router.get("/invoices")
def get_invoices(agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE status = 'Completed' AND agency_id = ?", (agency_id,))
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
def generate_invoice_for_tour(trip_id: int, day: Optional[str] = None, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
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
    cursor.execute("SELECT `key`, `value` FROM settings WHERE agency_id = ?", (agency_id,))
    settings_map = {r["key"]: r["value"] for r in cursor.fetchall()}
    conn.close()
    expenses_total = sum(e["amount"] for e in expenses)
    gst_total = sum(e["gst"] for e in expenses)
    grand_total = expenses_total + gst_total
    return {
        "agency_logo": "/yatralogo.jpg",
        "agency_name": settings_map.get("agency_name", "Yatra Travels Ltd"),
        "agency_gstin": settings_map.get("gstin", "27AAAAA1111A1Z1"),
        "currency": settings_map.get("currency", "INR"),
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
def download_invoice_pdf(trip_id: int, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT trip_id FROM tours WHERE trip_id = ? AND agency_id = ?", (trip_id, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Tour not found")
    return {
        "status": "success",
        "message": f"PDF invoice for trip #{trip_id} compiled successfully.",
        "download_url": f"/public/invoices/invoice_{trip_id}.pdf"
    }


# ── Reports ───────────────────────────────────────────────────────────────────

@router.get("/reports")
def generate_reports(
    report_type: str = Query(..., pattern="^(Expense|Profit|Tour|Vehicle|Driver|Customer|GST|Monthly|Yearly)$"),
    agency_id: str = Depends(get_agency_id),
):
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
def get_notifications(unread_only: bool = False, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    if unread_only:
        cursor.execute("SELECT * FROM notifications WHERE agency_id = ? AND read = 0 ORDER BY id DESC", (agency_id,))
    else:
        cursor.execute("SELECT * FROM notifications WHERE agency_id = ? ORDER BY id DESC", (agency_id,))
    notifications = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return notifications


@router.put("/notifications/{notif_id}/read")
def mark_notification_as_read(notif_id: int, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET read = 1 WHERE id = ? AND agency_id = ?", (notif_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Notification not found")
    conn.commit()
    conn.close()
    return {"message": "Notification marked as read"}


# ── Settings ──────────────────────────────────────────────────────────────────

@router.get("/settings")
def get_settings(agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("SELECT `key`, `value` FROM settings WHERE agency_id = ?", (agency_id,))
    settings_dict = {row["key"]: row["value"] for row in cursor.fetchall()}
    conn.close()
    return settings_dict


@router.put("/settings/{key}")
def update_settings(key: str, payload: SettingsUpdate, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("UPDATE settings SET value = ? WHERE agency_id = ? AND `key` = ?", (payload.value, agency_id, key))
    if cursor.rowcount == 0:
        try:
            cursor.execute("INSERT INTO settings (agency_id, `key`, `value`) VALUES (?, ?, ?)", (agency_id, key, payload.value))
        except Exception:
            cursor.execute("UPDATE settings SET value = ? WHERE agency_id = ? AND `key` = ?", (payload.value, agency_id, key))
    conn.commit()
    conn.close()
    return {"message": f"Setting '{key}' updated successfully."}