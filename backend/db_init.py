import os
import pymysql
import json
import re
from mysql_helper import MYSQL_CONFIG, get_db_conn, MySQLConnectionWrapper

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
    
    print("Dropping existing databases to ensure a clean state...")
    root_cursor.execute("DROP DATABASE IF EXISTS yatra_agency")
    root_cursor.execute("DROP DATABASE IF EXISTS yatra_traveller")
    root_cursor.execute("DROP DATABASE IF EXISTS yatra_team")
    
    # Read and run schema to create databases, tables, and foreign keys
    schema_path = os.path.join(os.path.dirname(__file__), "mysql_schema.sql")
    print(f"Reading schema from {schema_path}...")
    with open(schema_path, "r", encoding="utf-8") as f:
        sql_content = f.read()
        
    # Split by semicolon, executing each statement separately
    # Ignore comments and empty statements
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
            
    print("Executing schema statements...")
    for statement in statements:
        if statement.strip():
            root_cursor.execute(statement)
            
    root_conn.close()
    print("MySQL databases and tables created successfully.")

def seed_agency_db():
    print("Seeding Agency database...")
    conn = get_db_conn("yatra_agency")
    cursor = conn.cursor()
    
    # 1. Tours
    cursor.executemany("""
    INSERT INTO tours (destination, customer, agency, start_date, end_date, status, vehicle, driver, passengers, guide, budget, current_lat, current_lng, timeline_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("Mumbai to Goa Safari", "Rohan Sharma", "Yatra Travels Ltd", "2026-07-10", "2026-07-15", "Upcoming", "MH-01-DK-4507", "Vikram Singh", 4, "Ananya Sen", 25000.0, 19.0760, 72.8777, "Vehicle Assigned"),
        ("Royal Rajasthan Journey", "Priyah Patel", "Yatra Travels Ltd", "2026-07-01", "2026-07-08", "Active", "MH-02-AB-9876", "Amit Patel", 6, "Rajesh Kumar", 45000.0, 26.9124, 75.7873, "Journey Started"),
        ("Manali Hill Escape", "Kabir Mehta", "Yatra Travels Ltd", "2026-06-15", "2026-06-20", "Completed", "MH-04-PQ-9102", "Suresh Yadav", 2, "None", 18000.0, 32.2396, 77.1887, "Payment Completed")
    ])
    
    # 2. Stops for active tour (trip_id 2)
    cursor.executemany("""
    INSERT INTO tour_stops (trip_id, type, name, lat, lng, completed)
    VALUES (?, ?, ?, ?, ?, ?)""", [
        (2, "Hotel", "Jaipur Palace Stay", 26.9150, 75.7890, 1),
        (2, "Restaurant", "Spice Court Diner", 26.9010, 75.7720, 1),
        (2, "Fuel station", "HP Pump Expressway", 26.9500, 75.8200, 0),
        (2, "Destination", "Udaipur Lake View", 24.5854, 73.7125, 0)
    ])
    
    # 3. Timeline for active tour (trip_id 2)
    cursor.executemany("""
    INSERT INTO tour_timeline (trip_id, event_name, status, updated_at)
    VALUES (?, ?, ?, ?)""", [
        (2, "Booking Created", "Completed", "2026-06-28 10:00:00"),
        (2, "Vehicle Assigned", "Completed", "2026-06-29 11:30:00"),
        (2, "Driver Assigned", "Completed", "2026-06-29 12:00:00"),
        (2, "Journey Started", "Completed", "2026-07-01 06:00:00"),
        (2, "Reached Destination", "Pending", None),
        (2, "Journey Completed", "Pending", None),
        (2, "Invoice Generated", "Pending", None),
        (2, "Payment Completed", "Pending", None)
    ])
    
    # 4. Expenses
    cursor.executemany("""
    INSERT INTO expenses (trip_id, amount, gst, vendor, category, date, time, description, payment_mode, approved_by, status, receipt_image, ocr_extracted_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [
        (2, 4500.0, 810.0, "HP Petrol Pump", "Fuel", "2026-07-02", "14:30:00", "Fuel refill for Rajasthan trip", "Fuel Card", "Agency Head", "Approved", "fuel_receipt_102.png", json.dumps({"vendor": "HP Pump", "total": "₹4,500.00", "tax": "18%", "fuel_qty": "45L"})),
        (2, 6000.0, 1080.0, "Jaipur Palace Stay", "Stay", "2026-07-01", "21:00:00", "Driver and client stay night 1", "Corporate Credit Card", "Agency Head", "Approved", "stay_receipt_201.png", json.dumps({"vendor": "Jaipur Palace", "total": "₹6,000.00", "tax": "18%"})),
        (2, 1200.0, 60.0, "Spice Court Diner", "Food", "2026-07-02", "13:00:00", "Lunch for client & driver", "UPI", "Pending Admin", "Pending", "food_receipt_302.png", json.dumps({"vendor": "Spice Court", "total": "₹1,200.00", "tax": "5%"})),
        (1, 250.0, 0.0, "NH48 Toll Plaza", "Toll", "2026-07-05", "10:15:00", "Toll charge FASTag auto-debit", "FASTag", "System Auto-Approved", "Approved", "toll_receipt_401.png", json.dumps({"vendor": "FASTag", "total": "₹250.00"})),
        (3, 3000.0, 540.0, "Himalayan Mechanic", "Vehicle Maintenance", "2026-06-18", "11:00:00", "Brake pad replacement", "Cash", "Agency Head", "Approved", "maint_receipt_501.png", json.dumps({"vendor": "Himalayan Mechanic", "total": "₹3,000.00"}))
    ])
    
    # 5. Vehicles
    cursor.executemany("""
    INSERT INTO vehicles (vehicle_number, model, owner, insurance, permit, fitness, puc, fuel_type, mileage, current_location, availability, service_history, expenses, upcoming_maintenance)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("MH-01-DK-4507", "Toyota Innova Crysta", "Yatra Travels Ltd", "Active (Expires: 2027-02-15)", "National Permit (Expires: 2028-06-10)", "Valid (Expires: 2027-01-20)", "Valid (Expires: 2026-12-05)", "Diesel", 12.5, "Mumbai, MH", "Available", json.dumps([{"date": "2026-05-10", "type": "Engine Oil Change", "cost": 4500.0}]), 12000.0, "2026-08-10 (General Service)"),
        ("MH-02-AB-9876", "Tempo Traveller 17-Seater", "Partner Fleet Rent", "Active (Expires: 2026-11-20)", "State Permit (Expires: 2027-03-12)", "Valid (Expires: 2026-09-15)", "Valid (Expires: 2026-08-30)", "Diesel", 9.8, "Jaipur, RJ", "Assigned", json.dumps([{"date": "2026-04-20", "type": "Tire Replacement", "cost": 15000.0}]), 35000.0, "2026-09-01 (Tire Alignment)"),
        ("MH-04-PQ-9102", "Suzuki Ertiga", "Yatra Travels Ltd", "Active (Expires: 2027-05-01)", "Local Permit (Expires: 2027-05-01)", "Valid (Expires: 2027-05-01)", "Valid (Expires: 2026-11-10)", "CNG", 18.0, "Delhi, DL", "Available", json.dumps([{"date": "2026-06-18", "type": "Brake Maintenance", "cost": 3000.0}]), 5000.0, "2026-10-15 (CNG Filter Change)")
    ])
    
    # 6. Drivers
    cursor.executemany("""
    INSERT INTO drivers (name, license, aadhar, experience, trips_completed, assigned_tour, current_location, contact, emergency_contact, salary, expense, ratings, documents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("Vikram Singh", "DL-142018009283", "9283-1029-4829", 12, 148, "None", "Mumbai, MH", "+919876543210", "+919876543211", 25000.0, 1800.0, 4.8, json.dumps({"license_copy": "lic_vikram.pdf", "aadhar_copy": "aadhar_vikram.pdf"})),
        ("Amit Patel", "GJ-012015002931", "1029-4829-9283", 8, 92, "Royal Rajasthan Journey", "Jaipur, RJ", "+919822211100", "+919822211101", 22000.0, 3200.0, 4.6, json.dumps({"license_copy": "lic_amit.pdf", "aadhar_copy": "aadhar_amit.pdf"})),
        ("Suresh Yadav", "MH-122010009281", "4829-9283-1029", 15, 210, "None", "Delhi, DL", "+919111122233", "+919111122234", 28000.0, 850.0, 4.9, json.dumps({"license_copy": "lic_suresh.pdf", "aadhar_copy": "aadhar_suresh.pdf"}))
    ])
    
    # 7. Customers
    cursor.executemany("""
    INSERT INTO customers (name, contact, email, booking_history, invoices, payments, upcoming_tours, documents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("Rohan Sharma", "+91 99999 88888", "rohan.sharma@example.com", json.dumps([{"trip_id": 1, "status": "Upcoming"}]), json.dumps([]), json.dumps([]), json.dumps([{"trip_id": 1, "destination": "Mumbai to Goa Safari"}]), json.dumps({"passport": "PP-ROHAN.pdf", "emergency_contacts": {"name": "S. Sharma", "contact": "+91 99999 88887"}, "preferences": "Vegetarian food only, Window seat"})),
        ("Priyah Patel", "+91 98888 77777", "priyah.patel@example.com", json.dumps([{"trip_id": 2, "status": "Active"}]), json.dumps([]), json.dumps([]), json.dumps([]), json.dumps({"passport": "PP-PRIYAH.pdf", "emergency_contacts": {"name": "K. Patel", "contact": "+91 98888 77776"}, "preferences": "English guide, Non-smoking rooms"})),
        ("Kabir Mehta", "+91 97777 66666", "kabir.mehta@example.com", json.dumps([{"trip_id": 3, "status": "Completed"}]), json.dumps([{"invoice_id": 1003, "amount": 18000.0, "status": "Paid"}]), json.dumps([{"payment_id": "PAY-9102", "amount": 18000.0}]), json.dumps([]), json.dumps({"passport": "PP-KABIR.pdf", "preferences": "CNG vehicle preferred"}))
    ])

    # 8. Notifications
    cursor.executemany("""
    INSERT INTO notifications (type, title, message, date, `read`)
    VALUES (?, ?, ?, ?, ?)""", [
        ("Upcoming Trip", "Trip #1 to Goa starts in 5 days", "Please double check the assignment status.", "2026-07-05", 0),
        ("Pending Expense", "UPI Expense #3 pending approval", "Requires review from Agency Manager.", "2026-07-02", 0),
        ("Vehicle Maintenance", "MH-02-AB-9876 upcoming service due", "Service date: 2026-09-01.", "2026-07-04", 0),
        ("Insurance Expiry", "MH-02-AB-9876 insurance renewal due", "Expiry on 2026-11-20.", "2026-07-01", 1)
    ])
    
    # 9. Settings
    cursor.executemany("""
    INSERT INTO settings (`key`, `value`)
    VALUES (?, ?)""", [
        ("agency_name", "Yatra Travels Ltd"),
        ("gstin", "27AAAAA1111A1Z1"),
        ("currency", "INR"),
        ("auto_approve_fastag", "True")
    ])

    conn.commit()
    conn.close()
    print("Agency database seeded successfully.")

def seed_traveller_db():
    print("Seeding Traveller database...")
    conn = get_db_conn("yatra_traveller")
    cursor = conn.cursor()
    
    cursor.executemany("""
    INSERT INTO trips (name, route, date, duration, budget, status, driver, vehicle)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("Goa Beach Retreat", "Mumbai -> North Goa -> South Goa", "2026-07-18", "5 Days", 15000.0, "Confirmed", "Vikram Singh", "MH-01-DK-4507"),
        ("Royal Rajasthan Circuit", "Delhi -> Jaipur -> Udaipur -> Jodhpur", "2026-08-10", "8 Days", 28000.0, "Booked", "Amit Patel", "MH-01-LE-4321"),
        ("Manali Himalaya Adventure", "Delhi -> Manali -> Solang Valley", "2026-06-22", "6 Days", 18400.0, "Completed", "Suresh Yadav", "MH-04-PQ-9102")
    ])
    
    cursor.executemany("""
    INSERT INTO expenses (title, amount, date, category, status)
    VALUES (?, ?, ?, ?, ?)""", [
        ("Lonavala Stay", 4800.0, "2026-05-04", "Hotels", "Paid"),
        ("Surya Restaurant", 1200.0, "2026-06-24", "Food", "Paid"),
        ("FASTag Toll payment", 450.0, "2026-06-22", "Taxi", "Paid"),
        ("Goa Shopping Spree", 2500.0, "2026-07-03", "Shopping", "Paid"),
        ("Cinema Tickets", 600.0, "2026-07-04", "Entertainment", "Paid")
    ])
    
    cursor.executemany("""
    INSERT INTO bookings (trip_id, name, status, details)
    VALUES (?, ?, ?, ?)""", [
        (1, "Hotel Beach View", "Confirmed", "Deluxe Room, 4 nights"),
        (1, "Goa Sightseeing Cruise", "Confirmed", "Sunset cruise tickets for 4 passengers")
    ])
    
    cursor.executemany("""
    INSERT INTO documents (name, type, file_url, upload_date)
    VALUES (?, ?, ?, ?)""", [
        ("My Passport", "Passport", "passport_yugal.pdf", "2026-06-01"),
        ("Goa Hotel Voucher", "Booking Confirmation", "voucher_goa_hotel.pdf", "2026-07-01")
    ])
    
    cursor.execute("""
    INSERT INTO profile (name, email, contact, preferences)
    VALUES (?, ?, ?, ?)""", ("Yugal Kishor", "yugal@example.com", "+919999911111", "Window seats, Vegetarian, High floor hotels"))
    
    conn.commit()
    conn.close()
    print("Traveller database seeded successfully.")

def seed_team_db():
    print("Seeding Team database...")
    conn = get_db_conn("yatra_team")
    cursor = conn.cursor()
    
    cursor.executemany("""
    INSERT INTO agencies (name, owner, contact, email, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status, documents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""", [
        ("Yatra Travels Ltd", "Yatra CEO", "+919999922222", "ceo@yatratravels.com", "Active", 12, 2460000.0, 1610000.0, 24, 18, "Premium (Expires: 2027-01-01)", json.dumps(["pan_card.pdf", "gst_cert.pdf"])),
        ("Aditya Travels", "Aditya Sen", "+919888833333", "aditya@aditya.com", "Active", 5, 890000.0, 520000.0, 10, 8, "Basic (Expires: 2026-10-15)", json.dumps(["pan_card.pdf"])),
        ("Speedy Tour & Co", "Mohit Verma", "+919777744444", "mohit@speedy.com", "Pending Verification", 0, 0.0, 0.0, 2, 2, "Trial (Expires: 2026-07-20)", json.dumps(["pan_card.pdf", "gst_cert.pdf", "rc_book.pdf"]))
    ])
    
    cursor.executemany("""
    INSERT INTO travellers (name, email, trips_count, expenses_count, bookings_count, feedback_rating, ai_usage_tokens)
    VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        ("Yugal Kishor", "yugal@example.com", 3, 5, 2, 4.8, 12050),
        ("Rohan Sharma", "rohan@example.com", 1, 0, 1, 5.0, 4200),
        ("Amit Vyas", "amit@example.com", 8, 24, 10, 4.5, 34500)
    ])
    
    cursor.executemany("""
    INSERT INTO payments (agency_id, amount, date, status, description)
    VALUES (?, ?, ?, ?, ?)""", [
        (1, 15000.0, "2026-06-01", "Completed", "Premium monthly subscription renewal"),
        (2, 5000.0, "2026-06-15", "Completed", "Basic monthly subscription renewal"),
        (1, 15000.0, "2026-07-01", "Completed", "Premium monthly subscription renewal")
    ])
    
    cursor.executemany("""
    INSERT INTO subscriptions (name, cost, type, features)
    VALUES (?, ?, ?, ?)""", [
        ("Basic Tier", 5000.0, "Monthly", "Up to 10 vehicles, 10 drivers, standard reporting"),
        ("Premium Tier", 15000.0, "Monthly", "Unlimited fleet, AI Itinerary generator, OCR automation, custom portal branding"),
        ("Enterprise Tier", 120000.0, "Annual", "Unlimited fleet & AI, dedicated database instance, 24/7 support")
    ])

    cursor.executemany("""
    INSERT INTO support_tickets (agency_id, traveller_id, subject, description, status, priority, date)
    VALUES (?, ?, ?, ?, ?, ?, ?)""", [
        (1, None, "OCR Extraction Failed", "Receipt for trip #2 from HP fuel pump had blurry image, OCR couldn't extract vendor.", "Open", "Medium", "2026-07-04"),
        (None, 1, "App logout issue", "Getting automatically logged out from User Portal on page refresh.", "Closed", "Low", "2026-06-28")
    ])

    cursor.executemany("""
    INSERT INTO logs (timestamp, level, message)
    VALUES (?, ?, ?)""", [
        ("2026-07-05 12:00:00", "INFO", "Database seed completed successfully."),
        ("2026-07-05 12:15:30", "WARNING", "SMS Gateway response latency exceeded threshold (3.2s)."),
        ("2026-07-05 12:45:00", "INFO", "User Yugal Kishor logged into Traveller App.")
    ])
    
    conn.commit()
    conn.close()
    print("Team database seeded successfully.")

def main():
    try:
        initialize_mysql_databases()
        seed_agency_db()
        seed_traveller_db()
        seed_team_db()
        print("\nAll MySQL databases successfully initialized and seeded with mock data!")
    except Exception as e:
        print(f"\nDatabase initialization failed: {e}")
        raise e

if __name__ == "__main__":
    main()
