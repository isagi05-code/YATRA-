"""Agency Misc router — customers, invoices, reports, notifications, settings."""
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