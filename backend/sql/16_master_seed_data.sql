-- ============================================================================
-- YATRA ERP - Enterprise Master Seed Data Script
-- Target DB Engine: MySQL 8.x
-- ============================================================================

USE yatra_enterprise;

-- ----------------------------------------------------------------------------
-- 1. Seed Subscriptions Master
-- ----------------------------------------------------------------------------
INSERT INTO subscriptions (id, name, cost, type, billing_cycle, max_vehicles, max_drivers, features, is_active)
VALUES
  (1, 'Basic Tier', 5000.00, 'Monthly', 'Monthly', 10, 10, 'Up to 10 vehicles, 10 drivers, standard reporting', 1),
  (2, 'Premium Tier', 15000.00, 'Monthly', 'Monthly', 100, 100, 'Unlimited fleet, AI Itinerary generator, OCR automation, custom portal branding', 1),
  (3, 'Enterprise Tier', 120000.00, 'Annual', 'Annual', 9999, 9999, 'Unlimited fleet & AI, dedicated database instance, 24/7 support', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 2. Seed Agencies
-- ----------------------------------------------------------------------------
INSERT INTO agencies (id, agency_id, name, owner_name, email, contact, status, active_tours, revenue, expenses, drivers_count, vehicles_count, subscription_status)
VALUES
  (1, 'AGY-1001', 'Yatra Travels Ltd', 'Yatra CEO', 'ceo@yatratravels.com', '+919999922222', 'Active', 12, 2460000.00, 1610000.00, 24, 18, 'Premium Tier'),
  (2, 'AGY-1002', 'Aditya Travels', 'Aditya Sen', 'aditya@aditya.com', '+919888833333', 'Active', 5, 890000.00, 520000.00, 10, 8, 'Basic Tier'),
  (3, 'AGY-1003', 'Speedy Tour & Co', 'Mohit Verma', 'mohit@speedy.com', '+919777744444', 'Pending Verification', 0, 0.00, 0.00, 2, 2, 'Trial')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 3. Seed Users & Traveller Profiles
-- ----------------------------------------------------------------------------
INSERT INTO users (id, user_id, agency_id, user_type, name, email, phone, status)
VALUES
  (1, 'USR-1001', 'AGY-1001', 'AgencyAdmin', 'Yatra CEO', 'ceo@yatratravels.com', '+919999922222', 'Active'),
  (2, 'USR-1002', 'AGY-1002', 'AgencyAdmin', 'Aditya Sen', 'aditya@aditya.com', '+919888833333', 'Active'),
  (3, 'TRV-1001', NULL, 'Traveller', 'Yugal Kishor', 'yugal@example.com', '+919999911111', 'Active'),
  (4, 'TRV-1002', NULL, 'Traveller', 'Rohan Sharma', 'rohan@example.com', '+919999988888', 'Active'),
  (5, 'TRV-1003', NULL, 'Traveller', 'Amit Vyas', 'amit@example.com', '+919777755555', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO traveller_profiles (id, user_id, emergency_contact_name, emergency_contact_phone, preferences, trips_count, expenses_count, bookings_count, feedback_rating, ai_usage_tokens)
VALUES
  (1, 'TRV-1001', 'Emergency Contact', '+919999900000', 'Window seats, Vegetarian, High floor hotels', 3, 5, 2, 4.80, 12050),
  (2, 'TRV-1002', 'S. Sharma', '+919999988887', 'Vegetarian food only, Window seat', 1, 0, 1, 5.00, 4200),
  (3, 'TRV-1003', 'K. Vyas', '+919777755554', 'Non-smoking rooms, AC Bus', 8, 24, 10, 4.50, 34500)
ON DUPLICATE KEY UPDATE preferences=VALUES(preferences);

-- ----------------------------------------------------------------------------
-- 4. Seed Vehicles & Maintenance
-- ----------------------------------------------------------------------------
INSERT INTO vehicles (vehicle_number, agency_id, model, owner, insurance, permit, fuel_type, mileage, current_location, availability, expenses, upcoming_maintenance)
VALUES
  ('MH-01-DK-4507', 'AGY-1001', 'Toyota Innova Crysta', 'Yatra Travels Ltd', 'Active (Expires: 2027-02-15)', 'National Permit', 'Diesel', 12.50, 'Mumbai, MH', 'Available', 12000.00, '2026-08-10 (General Service)'),
  ('MH-02-AB-9876', 'AGY-1001', 'Tempo Traveller 17-Seater', 'Partner Fleet Rent', 'Active (Expires: 2026-11-20)', 'State Permit', 'Diesel', 9.80, 'Jaipur, RJ', 'Assigned', 35000.00, '2026-09-01 (Tire Alignment)'),
  ('MH-04-PQ-9102', 'AGY-1001', 'Suzuki Ertiga', 'Yatra Travels Ltd', 'Active (Expires: 2027-05-01)', 'Local Permit', 'CNG', 18.00, 'Delhi, DL', 'Available', 5000.00, '2026-10-15 (CNG Filter Change)')
ON DUPLICATE KEY UPDATE model=VALUES(model);

INSERT INTO vehicle_maintenance (id, agency_id, vehicle_number, service_type, service_date, cost, mechanic_vendor)
VALUES
  (1, 'AGY-1001', 'MH-01-DK-4507', 'Engine Oil Change', '2026-05-10', 4500.00, 'Authorized Toyota Service'),
  (2, 'AGY-1001', 'MH-02-AB-9876', 'Tire Replacement', '2026-04-20', 15000.00, 'MRF Tyre Hub'),
  (3, 'AGY-1001', 'MH-04-PQ-9102', 'Brake Pad Replacement', '2026-06-18', 3000.00, 'Himalayan Mechanic')
ON DUPLICATE KEY UPDATE service_type=VALUES(service_type);

-- ----------------------------------------------------------------------------
-- 5. Seed Drivers
-- ----------------------------------------------------------------------------
INSERT INTO drivers (driver_id, agency_id, name, license, aadhar, experience, trips_completed, assigned_tour, current_location, contact, emergency_contact, salary, expense, ratings)
VALUES
  (1, 'AGY-1001', 'Vikram Singh', 'DL-142018009283', '9283-1029-4829', 12, 148, 'None', 'Mumbai, MH', '+919876543210', '+919876543211', 25000.00, 1800.00, 4.80),
  (2, 'AGY-1001', 'Amit Patel', 'GJ-012015002931', '1029-4829-9283', 8, 92, 'Royal Rajasthan Journey', 'Jaipur, RJ', '+919822211100', '+919822211101', 22000.00, 3200.00, 4.60),
  (3, 'AGY-1001', 'Suresh Yadav', 'MH-122010009281', '4829-9283-1029', 15, 210, 'None', 'Delhi, DL', '+919111122233', '+919111122234', 28000.00, 850.00, 4.90)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 6. Seed Customers
-- ----------------------------------------------------------------------------
INSERT INTO customers (customer_id, agency_id, name, contact, email)
VALUES
  (1, 'AGY-1001', 'Rohan Sharma', '+91 99999 88888', 'rohan.sharma@example.com'),
  (2, 'AGY-1001', 'Priyah Patel', '+91 98888 77777', 'priyah.patel@example.com'),
  (3, 'AGY-1001', 'Kabir Mehta', '+91 97777 66666', 'kabir.mehta@example.com')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 7. Seed Tours & Itinerary Stops
-- ----------------------------------------------------------------------------
INSERT INTO tours (trip_id, agency_id, destination, customer, agency, start_date, end_date, status, vehicle, driver, passengers, guide, budget, current_lat, current_lng, timeline_status)
VALUES
  (1, 'AGY-1001', 'Mumbai to Goa Safari', 'Rohan Sharma', 'Yatra Travels Ltd', '2026-07-10', '2026-07-15', 'Upcoming', 'MH-01-DK-4507', 'Vikram Singh', 4, 'Ananya Sen', 25000.00, 19.076000, 72.877700, 'Vehicle Assigned'),
  (2, 'AGY-1001', 'Royal Rajasthan Journey', 'Priyah Patel', 'Yatra Travels Ltd', '2026-07-01', '2026-07-08', 'Active', 'MH-02-AB-9876', 'Amit Patel', 6, 'Rajesh Kumar', 45000.00, 26.912400, 75.787300, 'Journey Started'),
  (3, 'AGY-1001', 'Manali Hill Escape', 'Kabir Mehta', 'Yatra Travels Ltd', '2026-06-15', '2026-06-20', 'Completed', 'MH-04-PQ-9102', 'Suresh Yadav', 2, 'None', 18000.00, 32.239600, 77.188700, 'Payment Completed')
ON DUPLICATE KEY UPDATE destination=VALUES(destination);

INSERT INTO tour_stops (id, agency_id, trip_id, type, name, lat, lng, completed)
VALUES
  (1, 'AGY-1001', 2, 'Hotel', 'Jaipur Palace Stay', 26.915000, 75.789000, 1),
  (2, 'AGY-1001', 2, 'Restaurant', 'Spice Court Diner', 26.901000, 75.772000, 1),
  (3, 'AGY-1001', 2, 'Fuel station', 'HP Pump Expressway', 26.950000, 75.820000, 0),
  (4, 'AGY-1001', 2, 'Destination', 'Udaipur Lake View', 24.585400, 73.712500, 0)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ----------------------------------------------------------------------------
-- 8. Seed Expense Categories & Expenses
-- ----------------------------------------------------------------------------
INSERT INTO expense_categories (id, agency_id, name, code, is_system)
VALUES
  (1, NULL, 'Fuel', 'FUEL', 1),
  (2, NULL, 'Stay', 'STAY', 1),
  (3, NULL, 'Food', 'FOOD', 1),
  (4, NULL, 'Toll', 'TOLL', 1),
  (5, NULL, 'Vehicle Maintenance', 'MAINT', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO expenses (expense_id, trip_id, agency_id, amount, gst, vendor, category, `date`, `time`, description, payment_mode, approved_by, status, receipt_image)
VALUES
  (1, 2, 'AGY-1001', 4500.00, 810.00, 'HP Petrol Pump', 'Fuel', '2026-07-02', '14:30:00', 'Fuel refill for Rajasthan trip', 'Fuel Card', 'Agency Head', 'Approved', 'fuel_receipt_102.png'),
  (2, 2, 'AGY-1001', 6000.00, 1080.00, 'Jaipur Palace Stay', 'Stay', '2026-07-01', '21:00:00', 'Driver and client stay night 1', 'Corporate Credit Card', 'Agency Head', 'Approved', 'stay_receipt_201.png'),
  (3, 2, 'AGY-1001', 1200.00, 60.00, 'Spice Court Diner', 'Food', '2026-07-02', '13:00:00', 'Lunch for client & driver', 'UPI', 'Pending Admin', 'Pending', 'food_receipt_302.png'),
  (4, 1, 'AGY-1001', 250.00, 0.00, 'NH48 Toll Plaza', 'Toll', '2026-07-05', '10:15:00', 'Toll charge FASTag auto-debit', 'FASTag', 'System Auto-Approved', 'Approved', 'toll_receipt_401.png'),
  (5, 3, 'AGY-1001', 3000.00, 540.00, 'Himalayan Mechanic', 'Vehicle Maintenance', '2026-06-18', '11:00:00', 'Brake pad replacement', 'Cash', 'Agency Head', 'Approved', 'maint_receipt_501.png')
ON DUPLICATE KEY UPDATE amount=VALUES(amount);

-- ----------------------------------------------------------------------------
-- 9. Seed Settings & Notifications
-- ----------------------------------------------------------------------------
INSERT INTO agency_settings (agency_id, `key`, `value`)
VALUES
  ('AGY-1001', 'agency_name', 'Yatra Travels Ltd'),
  ('AGY-1001', 'gstin', '27AAAAA1111A1Z1'),
  ('AGY-1001', 'currency', 'INR'),
  ('AGY-1001', 'auto_approve_fastag', 'True')
ON DUPLICATE KEY UPDATE `value`=VALUES(`value`);

INSERT INTO notifications (id, agency_id, type, title, message, `date`, `read`)
VALUES
  (1, 'AGY-1001', 'Upcoming Trip', 'Trip #1 to Goa starts in 5 days', 'Please double check the assignment status.', '2026-07-05', 0),
  (2, 'AGY-1001', 'Pending Expense', 'UPI Expense #3 pending approval', 'Requires review from Agency Manager.', '2026-07-02', 0),
  (3, 'AGY-1001', 'Vehicle Maintenance', 'MH-02-AB-9876 upcoming service due', 'Service date: 2026-09-01.', '2026-07-04', 0)
ON DUPLICATE KEY UPDATE title=VALUES(title);
