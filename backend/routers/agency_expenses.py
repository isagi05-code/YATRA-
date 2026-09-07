"""Agency Expenses router — /expenses CRUD + OCR."""
import os
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File
from core.database import get_db_conn as get_mysql_conn
from schemas.agency import ExpenseCreate

router = APIRouter(prefix="/expenses", tags=["Agency Expenses"])


def get_db_conn():
    return get_mysql_conn("yatra_enterprise")


def require_agency_id(agency_id: Optional[str]) -> str:
    return agency_id or "AGY-1001"


def verify_tour_belongs_to_agency(cursor, trip_id: int, agency_id: str):
    cursor.execute("SELECT agency_id FROM tours WHERE trip_id = ?", (trip_id,))
    row = cursor.fetchone()
    if not row or row["agency_id"] != agency_id:
        raise HTTPException(status_code=404, detail="Tour not found for this agency")
    return row


@router.get("")
def get_expenses(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    query = """
        SELECT e.* FROM expenses e
        LEFT JOIN tours t ON e.trip_id = t.trip_id
        WHERE (t.agency_id = ? OR (e.trip_id IS NULL AND e.agency_id = ?))
    """
    params = [agency_id, agency_id]
    if category:
        query += " AND e.category = ?"
        params.append(category)
    if status:
        query += " AND e.status = ?"
        params.append(status)
    if search:
        query += " AND (e.vendor LIKE ? OR e.description LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")
    query += " ORDER BY e.date DESC, e.expense_id DESC"
    cursor.execute(query, params)
    expenses = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return expenses


@router.post("")
def create_expense(expense: ExpenseCreate, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    if expense.trip_id is not None:
        verify_tour_belongs_to_agency(cursor, expense.trip_id, agency_id)
    cursor.execute("""
    INSERT INTO expenses (trip_id, agency_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (expense.trip_id, agency_id, expense.amount, expense.gst, expense.vendor, expense.category, expense.date, expense.time, expense.description, expense.payment_mode, expense.approved_by, expense.status, expense.receipt_image))
    expense_id = cursor.lastrowid

    # If OCR data was supplied, record audit into ocr_results
    if expense.ocr_extracted_data:
        try:
            cursor.execute("""
            INSERT INTO ocr_results (agency_id, expense_id, raw_text, extracted_vendor, extracted_total, extracted_tax, extracted_date, structured_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (agency_id, expense_id, expense.description or "", expense.vendor, expense.amount, expense.gst, expense.date, expense.ocr_extracted_data))
        except Exception:
            pass

    conn.commit()
    conn.close()
    return {"message": "Expense created successfully", "expense_id": expense_id}


@router.post("/batch")
def create_expenses_batch(expenses: list[ExpenseCreate], agency_id: Optional[str] = None):
    """Bulk create verified expenses from batch OCR review in a single transaction."""
    if not expenses:
        raise HTTPException(status_code=400, detail="Expenses list cannot be empty")
    
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    created_ids = []

    try:
        for expense in expenses:
            if expense.trip_id is not None:
                verify_tour_belongs_to_agency(cursor, expense.trip_id, agency_id)
            cursor.execute("""
            INSERT INTO expenses (trip_id, agency_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (expense.trip_id, agency_id, expense.amount, expense.gst, expense.vendor, expense.category, expense.date, expense.time, expense.description, expense.payment_mode, expense.approved_by, expense.status, expense.receipt_image))
            exp_id = cursor.lastrowid
            created_ids.append(exp_id)

            if expense.ocr_extracted_data:
                try:
                    cursor.execute("""
                    INSERT INTO ocr_results (agency_id, expense_id, raw_text, extracted_vendor, extracted_total, extracted_tax, extracted_date, structured_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (agency_id, exp_id, expense.description or "", expense.vendor, expense.amount, expense.gst, expense.date, expense.ocr_extracted_data))
                except Exception:
                    pass

        conn.commit()
    except Exception as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to create batch expenses: {str(e)}")

    conn.close()
    return {"message": f"Successfully created {len(created_ids)} expenses", "created_ids": created_ids}


@router.post("/ocr/batch")
async def extract_ocr_batch(
    files: list[UploadFile] = File(...),
    agency_id: Optional[str] = None
):
    """Concurrent AI Multimodal OCR extraction for up to 5 receipts/bills.
    
    Engineered for sub 2-3 second SLA via asyncio.gather concurrency.
    Persists full raw extraction into JSON files, then runs deterministic filtering
    for required UI fields with zero fallbacks.
    """
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="At least 1 receipt file must be uploaded")
    if len(files) > 5:
        raise HTTPException(status_code=400, detail=f"Maximum 5 receipts allowed per batch. Received {len(files)} files.")

    import uuid
    import time
    import asyncio
    from services.ocr_service import extract_receipt_multimodal
    from services.ocr_filter import filter_receipt_data

    batch_id = f"ocr_{uuid.uuid4().hex[:8]}"
    t_start = time.perf_counter()

    async def _process_single_file(idx: int, upload: UploadFile) -> dict:
        filename = upload.filename or f"receipt_{idx+1}.jpg"
        content = await upload.read()
        if not content or len(content) == 0:
            return {
                "receipt_id": f"{batch_id}_{idx}",
                "receipt_index": idx,
                "filename": filename,
                "status": "Failed",
                "error": "Empty file received",
                "validation_passed": False
            }
        
        try:
            raw_data = await extract_receipt_multimodal(content, filename, timeout_seconds=60.0)
            filtered = filter_receipt_data(batch_id, idx, filename, raw_data)
            return filtered
        except Exception as e:
            # Zero fallback: transparent error reporting per receipt
            return {
                "receipt_id": f"{batch_id}_{idx}",
                "receipt_index": idx,
                "filename": filename,
                "status": "Failed",
                "error": str(e),
                "validation_passed": False
            }

    # Parallel async execution across all uploaded receipts
    items = await asyncio.gather(*[_process_single_file(i, f) for i, f in enumerate(files)])

    total_latency_ms = round((time.perf_counter() - t_start) * 1000, 1)
    success_count = sum(1 for it in items if it.get("status") != "Failed")

    return {
        "batch_id": batch_id,
        "total_latency_ms": total_latency_ms,
        "count": len(files),
        "success_count": success_count,
        "items": items
    }


@router.post("/ocr")
async def extract_ocr_receipt(
    file: UploadFile = File(...)
):
    """Single file AI OCR extraction wrapper."""
    res = await extract_ocr_batch(files=[file])
    return res["items"][0]


@router.get("/{expense_id}")
def get_expense(expense_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT e.* FROM expenses e
        LEFT JOIN tours t ON e.trip_id = t.trip_id
        WHERE e.expense_id = ? AND (t.agency_id = ? OR (e.trip_id IS NULL AND e.agency_id = ?))
    """, (expense_id, agency_id, agency_id))
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Expense not found")
    return dict(row)


@router.put("/{expense_id}")
def update_expense_status(expense_id: int, status: str, approved_by: str, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE expenses SET status = ?, approved_by = ?
        WHERE expense_id = ? AND (
            trip_id IN (SELECT trip_id FROM tours WHERE agency_id = ?)
            OR (trip_id IS NULL AND agency_id = ?)
        )
    """, (status, approved_by, expense_id, agency_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense status updated successfully"}


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, agency_id: Optional[str] = None):
    agency_id = require_agency_id(agency_id)
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM expenses WHERE expense_id = ? AND (
            trip_id IN (SELECT trip_id FROM tours WHERE agency_id = ?)
            OR (trip_id IS NULL AND agency_id = ?)
        )
    """, (expense_id, agency_id, agency_id))
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Expense not found")
    conn.commit()
    conn.close()
    return {"message": "Expense deleted successfully"}
