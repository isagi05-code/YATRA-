"""Agency Dashboard router — /dashboard/summary and /dashboard/graphs."""
from fastapi import APIRouter, Depends
from core.database import get_db_conn as get_mysql_conn
from auth_deps import get_agency_id

router = APIRouter(prefix="/dashboard", tags=["Agency Dashboard"])


def get_db_conn():
    return get_mysql_conn("yatra_agency")


def month_labels_from_rows(rows, value_key="total"):
    labels = [r["month_label"] for r in rows]
    data = [round(float(r[value_key] or 0) / 100000, 2) for r in rows]
    return labels, data


@router.get("/summary")
def get_dashboard_summary(agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Active'", (agency_id,))
    active_tours = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Completed'", (agency_id,))
    completed_tours = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM vehicles WHERE agency_id = ?", (agency_id,))
    total_vehicles = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM drivers WHERE agency_id = ?", (agency_id,))
    total_drivers = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Upcoming'", (agency_id,))
    upcoming_tours = cursor.fetchone()[0] or 0

    cursor.execute("SELECT COALESCE(SUM(budget), 0) FROM tours WHERE agency_id = ? AND status = 'Completed'", (agency_id,))
    total_revenue = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ?
    """, (agency_id,))
    total_expenses = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.status = 'Approved'
    """, (agency_id,))
    approved_expenses = float(cursor.fetchone()[0] or 0)

    profit = total_revenue - total_expenses

    cursor.execute("""
        SELECT COALESCE(SUM(t.budget), 0) FROM tours t
        WHERE t.agency_id = ? AND t.status = 'Completed'
        AND (t.timeline_status IS NULL OR t.timeline_status != 'Payment Completed')
    """, (agency_id,))
    pending_payments = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.date = CURDATE()
    """, (agency_id,))
    todays_expense = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND YEAR(e.date) = YEAR(CURDATE()) AND MONTH(e.date) = MONTH(CURDATE())
    """, (agency_id,))
    monthly_expense = float(cursor.fetchone()[0] or 0)

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND YEAR(e.date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND MONTH(e.date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
    """, (agency_id,))
    last_month_expense = float(cursor.fetchone()[0] or 0)

    if last_month_expense > 0:
        pct_change = ((monthly_expense - last_month_expense) / last_month_expense) * 100
        expense_trend = f"{'↑' if pct_change >= 0 else '↓'} {abs(pct_change):.0f}% this month"
    elif monthly_expense > 0:
        expense_trend = "↑ 100% this month"
    else:
        expense_trend = "No expenses yet"

    cursor.execute("SELECT * FROM notifications WHERE agency_id = ? ORDER BY id DESC LIMIT 5", (agency_id,))
    notifications = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return {
        "stats": {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "profit": profit,
            "active_tours": active_tours,
            "completed_tours": completed_tours,
            "total_vehicles": total_vehicles,
            "total_drivers": total_drivers,
            "pending_payments": pending_payments,
            "upcoming_tours": upcoming_tours,
            "todays_expense": todays_expense,
            "monthly_expense": monthly_expense,
            "expense_trend": expense_trend,
            "approved_expenses": approved_expenses,
        },
        "recent_notifications": notifications
    }


@router.get("/graphs")
def get_dashboard_graphs(agency_id: str = Depends(get_agency_id)):
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DATE_FORMAT(e.date, '%b') AS month_label, COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(e.date), MONTH(e.date), DATE_FORMAT(e.date, '%b')
        ORDER BY YEAR(e.date), MONTH(e.date)
    """, (agency_id,))
    monthly_rows = [dict(r) for r in cursor.fetchall()]
    me_labels, me_data = month_labels_from_rows(monthly_rows)

    cursor.execute("""
        SELECT DATE_FORMAT(t.end_date, '%b') AS month_label,
               COALESCE(SUM(t.budget), 0) AS revenue,
               COALESCE(SUM(e.amount), 0) AS expense
        FROM tours t
        LEFT JOIN expenses e ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND t.end_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(t.end_date), MONTH(t.end_date), DATE_FORMAT(t.end_date, '%b')
        ORDER BY YEAR(t.end_date), MONTH(t.end_date)
    """, (agency_id,))
    rev_rows = [dict(r) for r in cursor.fetchall()]
    rve_labels = [r["month_label"] for r in rev_rows]
    rve_revenue = [round(float(r["revenue"] or 0) / 100000, 2) for r in rev_rows]
    rve_expense = [round(float(r["expense"] or 0) / 100000, 2) for r in rev_rows]

    cursor.execute("""
        SELECT v.vehicle_number,
               COUNT(CASE WHEN t.status IN ('Active', 'Completed') THEN 1 END) AS days_active
        FROM vehicles v
        LEFT JOIN tours t ON t.vehicle = v.vehicle_number AND t.agency_id = v.agency_id
        WHERE v.agency_id = ?
        GROUP BY v.vehicle_number
    """, (agency_id,))
    veh_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT name, ratings FROM drivers WHERE agency_id = ? ORDER BY ratings DESC LIMIT 5", (agency_id,))
    drv_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT e.category, COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ?
        GROUP BY e.category
        ORDER BY total DESC
    """, (agency_id,))
    cat_rows = [dict(r) for r in cursor.fetchall()]
    cat_total = sum(float(r["total"] or 0) for r in cat_rows) or 1
    cat_labels = [r["category"] for r in cat_rows]
    cat_pcts = [round(float(r["total"] or 0) / cat_total * 100, 1) for r in cat_rows]

    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Completed'", (agency_id,))
    tours_completed = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Upcoming'", (agency_id,))
    tours_upcoming = cursor.fetchone()[0] or 0
    cursor.execute("SELECT COUNT(*) FROM tours WHERE agency_id = ? AND status = 'Active'", (agency_id,))
    tours_active = cursor.fetchone()[0] or 0

    cursor.execute("""
        SELECT CONCAT('Q', QUARTER(t.end_date)) AS quarter_label,
               COALESCE(SUM(t.budget), 0) - COALESCE(SUM(e.amount), 0) AS profit
        FROM tours t
        LEFT JOIN expenses e ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND t.status = 'Completed' AND YEAR(t.end_date) = YEAR(CURDATE())
        GROUP BY QUARTER(t.end_date), CONCAT('Q', QUARTER(t.end_date))
        ORDER BY QUARTER(t.end_date)
    """, (agency_id,))
    profit_rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT COALESCE(SUM(e.amount), 0) AS total
        FROM expenses e
        INNER JOIN tours t ON e.trip_id = t.trip_id
        WHERE t.agency_id = ? AND e.category = 'Fuel'
        AND e.date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)
    """, (agency_id,))
    fuel_total = float(cursor.fetchone()[0] or 0)
    fuel_weekly = [round(fuel_total / 4 / 1000, 1)] * 4 if fuel_total else [0, 0, 0, 0]
    conn.close()

    return {
        "monthly_expense": {"labels": me_labels or [], "data": me_data or []},
        "revenue_vs_expense": {"labels": rve_labels or [], "revenue": rve_revenue or [], "expense": rve_expense or []},
        "vehicle_usage": {"labels": [r["vehicle_number"] for r in veh_rows], "days_active": [int(r["days_active"] or 0) for r in veh_rows]},
        "driver_performance": {"labels": [r["name"] for r in drv_rows], "ratings": [float(r["ratings"] or 0) for r in drv_rows]},
        "fuel_consumption": {"labels": ["Week 1", "Week 2", "Week 3", "Week 4"], "liters": fuel_weekly},
        "category_wise_expense": {"labels": cat_labels or [], "percentages": cat_pcts or []},
        "tours_status": {"completed": tours_completed, "upcoming": tours_upcoming, "active": tours_active},
        "profit_trend": {"labels": [r["quarter_label"] for r in profit_rows], "profit": [round(float(r["profit"] or 0) / 100000, 2) for r in profit_rows]}
    }