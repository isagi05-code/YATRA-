import os
import pymysql
import json
import re
from core.database import MYSQL_CONFIG, get_db_conn, MySQLConnectionWrapper

def get_root_conn():
    config = MYSQL_CONFIG.copy()
    if 'database' in config:
        del config['database']
    conn = pymysql.connect(**config)
    return MySQLConnectionWrapper(conn)

def initialize_mysql_databases():
    print("Connecting to MySQL server...")
    root_conn = get_root_conn()
    root_cursor = root_conn.cursor()
    
    print("Dropping existing yatra_enterprise database...")
    root_cursor.execute("DROP DATABASE IF EXISTS yatra_enterprise")
    
    sql_dir = os.path.join(os.path.dirname(__file__), "sql")
    sql_files = sorted([f for f in os.listdir(sql_dir) if f.endswith(".sql")])
    
    print(f"Executing {len(sql_files)} enterprise SQL scripts from {sql_dir}...")
    for filename in sql_files:
        filepath = os.path.join(sql_dir, filename)
        print(f"Running script: {filename}...")
        with open(filepath, "r", encoding="utf-8") as f:
            sql_content = f.read()
            
        statements = []
        current_statement = []
        for line in sql_content.split('\n'):
            stripped = line.strip()
            if stripped.startswith('--') or stripped.startswith('#') or not stripped:
                continue
            current_statement.append(line)
            if line.endswith(';'):
                statements.append('\n'.join(current_statement))
                current_statement = []
                
        for statement in statements:
            if statement.strip():
                try:
                    root_cursor.execute(statement)
                except Exception as err:
                    print(f"Error executing statement in {filename}: {err}")
                    raise err
                    
    root_conn.close()
    print("All enterprise SQL scripts and compatibility views executed successfully.")
        
    seed_enterprise_db()
    seed_agency_db()
    seed_traveller_db()
    seed_team_db()

def seed_enterprise_db():
    print("Seeding Master Enterprise DB (users, roles, permissions)...")
    conn = get_db_conn("yatra_enterprise")
    cursor = conn.cursor()

    # 1. Master Permissions
    permissions_data = [
        ("tours:read", "Tours", "View agency tour packages and routes"),
        ("tours:write", "Tours", "Create, edit, and update tour packages"),
        ("expenses:read", "Expenses", "View agency expenses"),
        ("expenses:write", "Expenses", "Log and create new expenses"),
        ("expenses:approve", "Expenses", "Approve or reject expense claims"),
        ("vehicles:manage", "Fleet", "Add, edit, and manage vehicles"),
        ("drivers:manage", "Fleet", "Add, edit, and manage drivers"),
        ("invoices:read", "Invoices", "View and download trip invoices"),
        ("reports:download", "Reports", "Generate and download financial reports"),
        ("analytics:read", "Analytics", "View analytics graphs and metrics"),
        ("platform:admin", "Platform", "Super admin platform management")
    ]

    for key, mod, desc in permissions_data:
        try:
            cursor.execute("INSERT IGNORE INTO permissions (permission_key, module, description) VALUES (?, ?, ?)", (key, mod, desc))
        except Exception:
            pass

    # 2. Master System Roles
    roles_data = [
        ("Agency Owner", "Full administrative control over agency fleet, tours, and finances", 1),
        ("Manager", "Operations manager for tours, drivers, and vehicles", 1),
        ("Accountant", "Finance officer for managing expenses, invoices, and reports", 1),
        ("Driver", "Assigned vehicle driver with tour view and status logging", 1),
        ("Guide", "Assigned tour guide", 1),
        ("Traveller", "End traveller account for trip bookings and personal expenses", 1),
        ("Admin", "Yatra team admin staff", 1),
        ("Super Admin", "Full platform super admin", 1)
    ]

    for name, desc, sys_role in roles_data:
        try:
            cursor.execute("INSERT IGNORE INTO roles (agency_id, role_name, description, is_system_role) VALUES (NULL, ?, ?, ?)", (name, desc, sys_role))
        except Exception:
            pass

    # 3. Default Users (Agency Owner, Traveller, Super Admin)
    # Password for all default accounts is "Password@123"
    default_pass_hash = "$2b$12$Vw1DH/NjeP3nAZA4yL09i.VrDN2taVyJjR6VE8he1h9UwuJnVD0xG"

    users_seed = [
        ("USR-AGY-1001", "urva546@gmail.com", "+919999922222", "Urva Desai (Agency Owner)", default_pass_hash),
        ("USR-TRV-1001", "urva546@gmail.com", "+919999911111", "Urva Desai (Traveller)", default_pass_hash),
        ("USR-ADM-1001", "urva546@gmail.com", "+919999900000", "Urva Desai (Admin)", default_pass_hash),
        ("USR-AGY-1002", "ceo@yatratravels.com", "+919999922223", "Yatra Travels", default_pass_hash),
        ("USR-TRV-1002", "yugal@example.com", "+919999911112", "Yugal Kishor", default_pass_hash),
        ("USR-ADM-1002", "admin@yatra.ai", "+919999900001", "Yatra Admin", default_pass_hash)
    ]

    for uid, email, phone, name, pw_hash in users_seed:
        try:
            cursor.execute("""
                INSERT IGNORE INTO users (user_id, email, phone, name, password_hash, token_version, status)
                VALUES (?, ?, ?, ?, ?, 1, 'Active')
            """, (uid, email, phone, name, pw_hash))
        except Exception:
            pass

    # 4. Association Links
    try:
        cursor.execute("INSERT IGNORE INTO agency_members (agency_id, user_id, role, is_owner) VALUES ('AGY-1001', 'USR-AGY-1001', 'Agency Owner', 1)")
        cursor.execute("INSERT IGNORE INTO traveller_profiles (user_id) VALUES ('USR-TRV-1001')")
        cursor.execute("INSERT IGNORE INTO team_members (user_id, role) VALUES ('USR-ADM-1001', 'Super Admin')")
    except Exception:
        pass

    conn.commit()
    conn.close()
    print("Master Enterprise DB seeded with default users, roles, and permissions.")

def seed_agency_db():
    print("Seeding Agency database...")
    # All data goes into yatra_enterprise — the virtual DBs only hold views
    conn = get_db_conn("yatra_enterprise")
    cursor = conn.cursor()

    # 1. Tours
    cursor.executemany("""
    INSERT IGNORE INTO tours (agency_id, destination, customer, agency, start_date, end_date, status, vehicle, driver, passengers, guide, budget, current_lat, current_lng, timeline_status)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("AGY-1001", "Mumbai to Goa Safari", "Rohan Sharma", "Yatra Travels Ltd", "2026-07-10", "2026-07-15", "Upcoming", "MH-01-DK-4507", "Vikram Singh", 4, "Ananya Sen", 25000.0, 19.0760, 72.8777, "Vehicle Assigned"),
        ("AGY-1001", "Royal Rajasthan Journey", "Priyah Patel", "Yatra Travels Ltd", "2026-07-01", "2026-07-08", "Active", "MH-02-AB-9876", "Amit Patel", 6, "Rajesh Kumar", 45000.0, 26.9124, 75.7873, "Journey Started"),
        ("AGY-1001", "Manali Hill Escape", "Kabir Mehta", "Yatra Travels Ltd", "2026-06-15", "2026-06-20", "Completed", "MH-04-PQ-9102", "Suresh Yadav", 2, "None", 18000.0, 32.2396, 77.1887, "Payment Completed")
    ])

    # 2. Tour Stops
    cursor.executemany("""
    INSERT IGNORE INTO tour_stops (trip_id, type, name, lat, lng, completed)
    VALUES (%s, %s, %s, %s, %s, %s)""", [
        (2, "Hotel", "Jaipur Palace Stay", 26.9150, 75.7890, 1),
        (2, "Restaurant", "Spice Court Diner", 26.9010, 75.7720, 1),
        (2, "Fuel station", "HP Pump Expressway", 26.9500, 75.8200, 0),
        (2, "Destination", "Udaipur Lake View", 24.5854, 73.7125, 0)
    ])

    # 3. Tour Timeline
    cursor.executemany("""
    INSERT IGNORE INTO tour_timeline (trip_id, event_name, status, updated_at)
    VALUES (%s, %s, %s, %s)""", [
        (2, "Booking Created", "Completed", "2026-06-28 10:00:00"),
        (2, "Vehicle Assigned", "Completed", "2026-06-29 11:30:00"),
        (2, "Driver Assigned", "Completed", "2026-06-29 12:00:00"),
        (2, "Journey Started", "Completed", "2026-07-01 06:00:00"),
        (2, "Reached Destination", "Pending", None),
        (2, "Journey Completed", "Pending", None),
        (2, "Invoice Generated", "Pending", None),
        (2, "Payment Completed", "Pending", None)
    ])

    # 4. Expenses (into yatra_enterprise.expenses — the real table)
    cursor.executemany("""
    INSERT IGNORE INTO expenses (trip_id, agency_id, amount, gst, vendor, category, `date`, `time`, description, payment_mode, approved_by, status, receipt_image)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        (2, "AGY-1001", 4500.0, 810.0, "HP Petrol Pump", "Fuel", "2026-07-02", "14:30:00", "Fuel refill for Rajasthan trip", "Fuel Card", "Agency Head", "Approved", "fuel_receipt_102.png"),
        (2, "AGY-1001", 6000.0, 1080.0, "Jaipur Palace Stay", "Stay", "2026-07-01", "21:00:00", "Driver and client stay night 1", "Corporate Credit Card", "Agency Head", "Approved", "stay_receipt_201.png"),
        (2, "AGY-1001", 1200.0, 60.0, "Spice Court Diner", "Food", "2026-07-02", "13:00:00", "Lunch for client & driver", "UPI", "Pending Admin", "Pending", "food_receipt_302.png"),
        (1, "AGY-1001", 250.0, 0.0, "NH48 Toll Plaza", "Toll", "2026-07-05", "10:15:00", "Toll charge FASTag auto-debit", "FASTag", "System Auto-Approved", "Approved", "toll_receipt_401.png"),
        (3, "AGY-1001", 3000.0, 540.0, "Himalayan Mechanic", "Vehicle Maintenance", "2026-06-18", "11:00:00", "Brake pad replacement", "Cash", "Agency Head", "Approved", "maint_receipt_501.png")
    ])

    # 5. Vehicles — uses MySQL column names: insurance_expiry, permit_expiry, fitness_expiry, puc_expiry
    cursor.executemany("""
    INSERT IGNORE INTO vehicles (vehicle_number, agency_id, model, owner, insurance, insurance_expiry, permit, permit_expiry, fitness_expiry, puc_expiry, fuel_type, mileage, current_location, availability, expenses, upcoming_maintenance)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("MH-01-DK-4507", "AGY-1001", "Toyota Innova Crysta", "Yatra Travels Ltd", "Active", "2027-02-15", "National Permit", "2028-06-10", "2027-01-20", "2026-12-05", "Diesel", 12.5, "Mumbai, MH", "Available", 12000.0, "2026-08-10 (General Service)"),
        ("MH-02-AB-9876", "AGY-1001", "Tempo Traveller 17-Seater", "Partner Fleet Rent", "Active", "2026-11-20", "State Permit", "2027-03-12", "2026-09-15", "2026-08-30", "Diesel", 9.8, "Jaipur, RJ", "Assigned", 35000.0, "2026-09-01 (Tire Alignment)"),
        ("MH-04-PQ-9102", "AGY-1001", "Suzuki Ertiga", "Yatra Travels Ltd", "Active", "2027-05-01", "Local Permit", "2027-05-01", "2027-05-01", "2026-11-10", "CNG", 18.0, "Delhi, DL", "Available", 5000.0, "2026-10-15 (CNG Filter Change)")
    ])

    # 6. Drivers
    cursor.executemany("""
    INSERT IGNORE INTO drivers (agency_id, name, license, aadhar, experience, trips_completed, assigned_tour, current_location, contact, emergency_contact, salary, expense, ratings, documents)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("AGY-1001", "Vikram Singh", "DL-142018009283", "9283-1029-4829", 12, 148, "None", "Mumbai, MH", "+919876543210", "+919876543211", 25000.0, 1800.0, 4.8, json.dumps({"license_copy": "lic_vikram.pdf", "aadhar_copy": "aadhar_vikram.pdf"})),
        ("AGY-1001", "Amit Patel", "GJ-012015002931", "1029-4829-9283", 8, 92, "Royal Rajasthan Journey", "Jaipur, RJ", "+919822211100", "+919822211101", 22000.0, 3200.0, 4.6, json.dumps({"license_copy": "lic_amit.pdf", "aadhar_copy": "aadhar_amit.pdf"})),
        ("AGY-1001", "Suresh Yadav", "MH-122010009281", "4829-9283-1029", 15, 210, "None", "Delhi, DL", "+919111122233", "+919111122234", 28000.0, 850.0, 4.9, json.dumps({"license_copy": "lic_suresh.pdf", "aadhar_copy": "aadhar_suresh.pdf"}))
    ])

    # 7. Customers
    cursor.executemany("""
    INSERT IGNORE INTO customers (agency_id, name, contact, email, booking_history, invoices, payments, upcoming_tours, documents)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("AGY-1001", "Rohan Sharma", "+91 99999 88888", "rohan.sharma@example.com", json.dumps([{"trip_id": 1, "status": "Upcoming"}]), json.dumps([]), json.dumps([]), json.dumps([{"trip_id": 1, "destination": "Mumbai to Goa Safari"}]), json.dumps({"passport": "PP-ROHAN.pdf", "preferences": "Vegetarian food only, Window seat"})),
        ("AGY-1001", "Priyah Patel", "+91 98888 77777", "priyah.patel@example.com", json.dumps([{"trip_id": 2, "status": "Active"}]), json.dumps([]), json.dumps([]), json.dumps([]), json.dumps({"passport": "PP-PRIYAH.pdf", "preferences": "English guide, Non-smoking rooms"})),
        ("AGY-1001", "Kabir Mehta", "+91 97777 66666", "kabir.mehta@example.com", json.dumps([{"trip_id": 3, "status": "Completed"}]), json.dumps([{"invoice_id": 1003, "amount": 18000.0, "status": "Paid"}]), json.dumps([{"payment_id": "PAY-9102", "amount": 18000.0}]), json.dumps([]), json.dumps({"passport": "PP-KABIR.pdf", "preferences": "CNG vehicle preferred"}))
    ])

    # 8. Notifications — `date` and `read` are reserved words in MySQL, require backticks
    cursor.executemany("""
    INSERT IGNORE INTO notifications (agency_id, type, title, message, `date`, `read`)
    VALUES (%s, %s, %s, %s, %s, %s)""", [
        ("AGY-1001", "Upcoming Trip", "Trip #1 to Goa starts in 5 days", "Please double check the assignment status.", "2026-07-05", 0),
        ("AGY-1001", "Pending Expense", "UPI Expense #3 pending approval", "Requires review from Agency Manager.", "2026-07-02", 0),
        ("AGY-1001", "Vehicle Maintenance", "MH-02-AB-9876 upcoming service due", "Service date: 2026-09-01.", "2026-07-04", 0),
        ("AGY-1001", "Insurance Expiry", "MH-02-AB-9876 insurance renewal due", "Expiry on 2026-11-20.", "2026-07-01", 1)
    ])

    # 9. Agency Settings — MySQL schema has agency_id column in agency_settings
    cursor.executemany("""
    INSERT IGNORE INTO agency_settings (agency_id, `key`, `value`)
    VALUES (%s, %s, %s)""", [
        ("AGY-1001", "agency_name", "Yatra Travels Ltd"),
        ("AGY-1001", "gstin", "27AAAAA1111A1Z1"),
        ("AGY-1001", "currency", "INR"),
        ("AGY-1001", "auto_approve_fastag", "True")
    ])

    conn.commit()
    conn.close()
    print("Agency database seeded successfully.")

def seed_traveller_db():
    print("Seeding Traveller database...")
    # All data goes into yatra_enterprise — the virtual DBs only hold views
    conn = get_db_conn("yatra_enterprise")
    cursor = conn.cursor()

    # Traveller trips go into yatra_enterprise.tours (with user_id set)
    cursor.executemany("""
    INSERT IGNORE INTO tours (user_id, destination, start_date, end_date, budget, status, driver, vehicle)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("USR-TRV-1001", "Goa Beach Retreat", "2026-07-18", "2026-07-23", 15000.0, "Confirmed", "Vikram Singh", "MH-01-DK-4507"),
        ("USR-TRV-1001", "Royal Rajasthan Circuit", "2026-08-10", "2026-08-18", 28000.0, "Booked", "Amit Patel", "MH-01-LE-4321"),
        ("USR-TRV-1001", "Manali Himalaya Adventure", "2026-06-22", "2026-06-28", 18400.0, "Completed", "Suresh Yadav", "MH-04-PQ-9102")
    ])

    # Traveller expenses into yatra_enterprise.expenses (with user_id, title)
    cursor.executemany("""
    INSERT IGNORE INTO expenses (user_id, title, amount, `date`, category, status)
    VALUES (%s, %s, %s, %s, %s, %s)""", [
        ("USR-TRV-1001", "Lonavala Stay", 4800.0, "2026-05-04", "Hotels", "Paid"),
        ("USR-TRV-1001", "Surya Restaurant", 1200.0, "2026-06-24", "Food", "Paid"),
        ("USR-TRV-1001", "FASTag Toll payment", 450.0, "2026-06-22", "Taxi", "Paid"),
        ("USR-TRV-1001", "Goa Shopping Spree", 2500.0, "2026-07-03", "Shopping", "Paid"),
        ("USR-TRV-1001", "Cinema Tickets", 600.0, "2026-07-04", "Entertainment", "Paid")
    ])

    cursor.executemany("""
    INSERT IGNORE INTO bookings (user_id, trip_id, name, status, details)
    VALUES (%s, %s, %s, %s, %s)""", [
        ("USR-TRV-1001", 1, "Hotel Beach View", "Confirmed", "Deluxe Room, 4 nights"),
        ("USR-TRV-1001", 1, "Goa Sightseeing Cruise", "Confirmed", "Sunset cruise tickets for 4 passengers")
    ])

    cursor.executemany("""
    INSERT IGNORE INTO documents (user_id, name, type, file_url, upload_date)
    VALUES (%s, %s, %s, %s, %s)""", [
        ("USR-TRV-1001", "My Passport", "Passport", "passport_yugal.pdf", "2026-06-01"),
        ("USR-TRV-1001", "Goa Hotel Voucher", "Booking Confirmation", "voucher_goa_hotel.pdf", "2026-07-01")
    ])

    # Update traveller_profiles with preferences
    try:
        cursor.execute("""
        UPDATE traveller_profiles SET preferences = %s WHERE user_id = %s
        """, ("Window seats, Vegetarian, High floor hotels", "USR-TRV-1001"))
    except Exception:
        pass

    conn.commit()
    conn.close()
    print("Traveller database seeded successfully.")


def seed_team_db():
    print("Seeding Team database...")
    # All data goes into yatra_enterprise — the virtual DBs only hold views
    conn = get_db_conn("yatra_enterprise")
    cursor = conn.cursor()

    # Extra agencies (AGY-1001 seeded in seed_agency_db above)
    cursor.executemany("""
    INSERT IGNORE INTO agencies (agency_id, name, owner_name, contact, email, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""", [
        ("AGY-1002", "Aditya Travels", "Aditya Sen", "+919888833333", "aditya@aditya.com", "Active", 5, 890000.0, 520000.0, 10, 8, "Basic"),
        ("AGY-1003", "Speedy Tour & Co", "Mohit Verma", "+919777744444", "mohit@speedy.com", "Pending Verification", 0, 0.0, 0.0, 2, 2, "Trial")
    ])

    # Extra traveller profiles — only seed basic columns that exist in both MySQL and SQLite schema
    cursor.executemany("""
    INSERT IGNORE INTO traveller_profiles (user_id, preferences)
    VALUES (%s, %s)""", [
        ("USR-TRV-1002", ""),
        ("USR-TRV-1003", "")
    ])

    # Payments
    cursor.executemany("""
    INSERT IGNORE INTO payments (agency_id, amount, `date`, status, description)
    VALUES (%s, %s, %s, %s, %s)""", [
        ("AGY-1001", 15000.0, "2026-06-01", "Completed", "Premium monthly subscription renewal"),
        ("AGY-1002", 5000.0, "2026-06-15", "Completed", "Basic monthly subscription renewal"),
        ("AGY-1001", 15000.0, "2026-07-01", "Completed", "Premium monthly subscription renewal")
    ])

    # Subscriptions
    cursor.executemany("""
    INSERT IGNORE INTO subscriptions (name, cost, type, features)
    VALUES (%s, %s, %s, %s)""", [
        ("Basic Tier", 5000.0, "Monthly", "Up to 10 vehicles, 10 drivers, standard reporting"),
        ("Premium Tier", 15000.0, "Monthly", "Unlimited fleet, AI Itinerary generator, OCR automation, custom portal branding"),
        ("Enterprise Tier", 120000.0, "Annual", "Unlimited fleet & AI, dedicated database instance, 24/7 support")
    ])

    # Support Tickets
    cursor.executemany("""
    INSERT IGNORE INTO support_tickets (agency_id, traveller_id, subject, description, status, priority, `date`)
    VALUES (%s, %s, %s, %s, %s, %s, %s)""", [
        ("AGY-1001", None, "OCR Extraction Failed", "Receipt for trip #2 from HP fuel pump had blurry image, OCR couldn't extract vendor.", "Open", "Medium", "2026-07-04"),
        (None, "USR-TRV-1001", "App logout issue", "Getting automatically logged out from User Portal on page refresh.", "Closed", "Low", "2026-06-28")
    ])

    # Audit logs — table is named 'logs' in SQLite schema, 'audit_logs' in MySQL schema
    # Use a try/except to handle both DB types gracefully
    for log_entry in [
        ("2026-07-05 12:00:00", "INFO", "Database seed completed successfully."),
        ("2026-07-05 12:15:30", "WARNING", "SMS Gateway response latency exceeded threshold (3.2s)."),
        ("2026-07-05 12:45:00", "INFO", "User Yugal Kishor logged into Traveller App.")
    ]:
        try:
            cursor.execute(
                "INSERT IGNORE INTO audit_logs (`timestamp`, level, message) VALUES (%s, %s, %s)",
                log_entry
            )
        except Exception:
            try:
                cursor.execute(
                    "INSERT OR IGNORE INTO logs (timestamp, level, message) VALUES (?, ?, ?)",
                    log_entry
                )
            except Exception:
                pass

    conn.commit()
    conn.close()
    print("Team database seeded successfully.")


def main():
    try:
        initialize_mysql_databases()
        print("\nAll Enterprise database tables, compatibility views, and master seed data initialized successfully!")
    except Exception as e:
        print(f"\nDatabase initialization failed: {e}")
        raise e

if __name__ == "__main__":
    main()
