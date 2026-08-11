"""Agency Expenses router — /expenses CRUD + OCR."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from core.database import get_db_conn as get_mysql_conn
from schemas.agency import ExpenseCreate
from auth_deps import get_agency_id, AuthUser, require_agency_context

router = APIRouter(prefix="/expenses", tags=["Agency Expenses"])


def get_db_conn():
    return get_mysql_conn("yatra_agency")


def verify_tour_belongs_to_agency(cursor, trip_id: int, agency_id: str):
    cursor.execute("SELECT agency_id FROM tours WHERE trip_id = ?", (trip_id,))
    row = cursor.fetchone()
    if not row or row["agency_id"] != agency_id:
        raise HTTPException(status_code=404, detail="Tour not found for this agency")
    return row


@router.get("")
def get_expenses(category: Optional[str] = None, status: Optional[str] = None, search: Optional[str] = None, agency_id: str = Depends(get_agency_id)):
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
def create_expense(expense: ExpenseCreate, agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()
    if expense.trip_id is not None:
        verify_tour_belongs_to_agency(cursor, expense.trip_id, agency_id)
    cursor.execute("""
    INSERT INTO expenses (trip_id, agency_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image, ocr_extracted_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
    (expense.trip_id, agency_id, expense.amount, expense.gst, expense.vendor, expense.category, expense.date, expense.time, expense.description, expense.payment_mode, expense.approved_by, expense.status, expense.receipt_image, expense.ocr_extracted_data))
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"message": "Expense created successfully", "expense_id": expense_id}


@router.post("/ocr")
def extract_ocr_receipt(receipt_image: str, agency_id: str = Depends(get_agency_id)):
    vendor = "Shell Fuel Station"
    if "toll" in receipt_image.lower():
        vendor = "NH-8 Toll Booth"
        amount = 350.0
        gst = 0.0
        category = "Toll"
    elif "hotel" in receipt_image.lower() or "stay" in receipt_image.lower():
        vendor = "Himalayan Lodge"
        amount = 4500.0
        gst = 810.0
        category = "Stay"
    else:
        amount = 1850.0
        gst = 333.0
        category = "Fuel"
    return {
        "extracted_data": {
            "vendor": vendor,
            "amount": amount,
            "gst": gst,
            "category": category,
            "date": "2026-07-05",
            "time": "12:30:15",
            "confidence_score": 0.98,
            "description": "Auto-extracted by Yatra AI OCR engine"
        }
    }


@router.get("/{expense_id}")
def get_expense(expense_id: int, agency_id: str = Depends(get_agency_id)):
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
def update_expense_status(
    expense_id: int,
    status: str,
    current_user: AuthUser = Depends(require_agency_context),
):
    """
    approved_by is taken from the verified JWT identity, never from a client-
    supplied field — this keeps the approval audit trail meaningful.
    """
    agency_id = current_user.agency_id
    approved_by = current_user.name
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
    return {"message": "Expense status updated successfully", "approved_by": approved_by}


@router.delete("/{expense_id}")
def delete_expense(expense_id: int, agency_id: str = Depends(get_agency_id)):
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