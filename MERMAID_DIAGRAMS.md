# YATRA System Architecture & Mermaid Diagrams

> Comprehensive visual documentation of the YATRA AI-Powered Travel Management Platform.

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["🖥️  Frontend Layer (Vite + React 18 SPA)"]
        direction TB
        LP["LandingPortal.jsx\nRole Selection & OTP Auth"]
        AP["AgencyPortal\nMulti-tab Partner SPA"]
        UP["UserPortal\nTraveller Trip SPA"]
        TP["TeamPortal\nAdmin Oversight SPA"]
        UI["components/ui\nShared Primitive Component System"]
        API["services/api.js\nAxios HTTP Client Layer"]

        LP -->|select role| AP & UP & TP
        UI --> AP & UP & TP
        AP & UP & TP --> API
    end

    subgraph BACKEND["⚙️  Backend Microservices Layer (FastAPI + Uvicorn)"]
        direction TB
        ORCH["run_backend.py\nProcess Orchestrator & Port Launcher"]

        subgraph PORTS["Microservice API Endpoints"]
            AA["agency_api.py\n:8000 (Agency Operations & AI Planner)"]
            TA["traveller_api.py\n:8001 (Traveller Trips & Bookings)"]
            TMA["team_api.py\n:8002 (Platform Oversight & Analytics)"]
            AUTHA["auth_api.py\n:8003 (Auth & OTP Verification)"]
        end

        CORE["core/config.py & database.py\nCentral Settings & Pool Config"]
        NOTIF["services/notifications.py\nSMTP Email & SMS Gateway"]
        POOL["mysql_helper.py\nMySQL Connection Pool & Query Translator"]

        ORCH --> AA & TA & TMA & AUTHA
        AA & TA & TMA & AUTHA --> CORE
        AA & TA & TMA & AUTHA --> POOL
        AA & AUTHA --> NOTIF
    end

    subgraph DB["🗄️  Multi-Tenant Database Layer (MySQL)"]
        direction LR
        DBA["yatra_agency\ntours · stops · expenses\nvehicles · drivers · notifications"]
        DBT["yatra_traveller\ntrips · expenses\nbookings · documents"]
        DBM["yatra_team\nagencies · travellers\npayments · support_tickets · logs"]
    end

    subgraph EXT["☁️  External Integrations"]
        SMTP["Gmail SMTP Server\nOTP Email Dispatch"]
        AI["AI / LLM Engine\nItinerary Generation Service"]
    end

    API -->|HTTP REST :8000| AA
    API -->|HTTP REST :8001| TA
    API -->|HTTP REST :8002| TMA
    API -->|HTTP REST :8003| AUTHA

    POOL --> DBA & DBT & DBM
    NOTIF --> SMTP
    AA -->|POST /ai-itinerary| AI
```

---

## 2. Frontend Component Breakdown & Routing Architecture

```mermaid
flowchart LR
    subgraph APP["App.jsx (Root Router & State Provider)"]
        direction TB
        
        subgraph SHARED["Shared Component Library (components/ui)"]
            B["Button"]
            C["Card"]
            I["Input"]
            BG["Badge"]
            M["Modal"]
            T["Table"]
            SB["Sidebar.jsx"]
        end

        LAND["LandingPortal.jsx\nHero · Role Selector · OTP Auth Modal"]

        subgraph AGENCY["AgencyPortal Component Hierarchy"]
            DH["DashboardHero.jsx\nGreeting & Revenue Summary"]
            QA["QuickActions.jsx\nShortcut Navigation Bar"]
            DP["DashboardPage.jsx\nMain Dashboard Container"]
            TP["ToursPage.jsx\nTour Management Table & Modal"]
            AI["AiItineraryPage.jsx\nAI Itinerary Generator & Timeline"]
            VP["VehiclesPage.jsx\nFleet & Vehicle Tracker"]
            DRP["DriversPage.jsx\nDriver Ratings & Roster"]
            EP["ExpensesPage.jsx\nExpense Log & Ledger"]
            ANP["AnalyticsPage.jsx\nChart.js Financial Visualizations"]
            RP["ReportsPage.jsx\nBusiness Insights & Exports"]
        end

        subgraph USER["UserPortal Component Hierarchy"]
            UD["Dashboard.jsx"]
            UT["TripsPage.jsx"]
            UE["ExpensesPage.jsx"]
            UAI["AiAssistant.jsx"]
        end

        subgraph TEAM["TeamPortal Component Hierarchy"]
            TO["PlatformOverview.jsx"]
            TA["AgenciesList.jsx"]
            TT["TravellersList.jsx"]
            TS["SupportTickets.jsx"]
        end
    end

    LAND --> AGENCY & USER & TEAM
    SHARED --> AGENCY & USER & TEAM
    DP --> DH & QA
```

---

## 3. Backend Microservices Router Topology

```mermaid
flowchart TD
    subgraph LAUNCHER["run_backend.py"]
        L1["Process Launcher"]
    end

    subgraph AUTH_SERVICE["Auth Microservice (:8003)"]
        AU1["POST /auth/send-otp"]
        AU2["POST /auth/verify-otp"]
        AU3["POST /auth/logout"]
    end

    subgraph AGENCY_SERVICE["Agency Microservice (:8000)"]
        AG1["GET /dashboard/summary"]
        AG2["GET / POST /tours"]
        AG3["GET / PUT / DELETE /tours/:id"]
        AG4["GET / POST /expenses"]
        AG5["GET / POST /vehicles"]
        AG6["GET / POST /drivers"]
        AG7["POST /ai-itinerary"]
        AG8["GET /reports"]
    end

    subgraph TRAVELLER_SERVICE["Traveller Microservice (:8001)"]
        TR1["GET /dashboard/summary"]
        TR2["GET / POST /trips"]
        TR3["GET / POST /expenses"]
        TR4["GET / POST /bookings"]
        TR5["GET / PUT /profile"]
    end

    subgraph TEAM_SERVICE["Team Microservice (:8002)"]
        TM1["GET /dashboard/summary"]
        TM2["GET / PUT /agencies"]
        TM3["GET /travellers"]
        TM4["GET /analytics"]
        TM5["GET /health"]
    end

    L1 --> AUTH_SERVICE & AGENCY_SERVICE & TRAVELLER_SERVICE & TEAM_SERVICE
```

---

## 4. Multi-Tenant Database Schema (Entity Relationships)

```mermaid
erDiagram
    %% DATABASE: yatra_agency
    TOURS {
        int trip_id PK
        string agency_id
        string title
        string destination
        string status
        decimal budget
        date start_date
        date end_date
    }
    TOUR_STOPS {
        int stop_id PK
        int trip_id FK
        string location_name
        decimal latitude
        decimal longitude
        int stop_order
    }
    AGENCY_EXPENSES {
        int expense_id PK
        int trip_id FK
        string agency_id
        decimal amount
        string category
        string description
    }
    VEHICLES {
        string vehicle_number PK
        string agency_id
        string model
        string type
        string status
    }
    DRIVERS {
        int driver_id PK
        string agency_id
        string name
        string phone
        decimal rating
    }

    %% DATABASE: yatra_traveller
    TRAVELLER_TRIPS {
        int trip_id PK
        string user_id
        string title
        string destination
        decimal total_budget
        string status
    }
    TRAVELLER_EXPENSES {
        int expense_id PK
        int trip_id FK
        string user_id
        string title
        decimal amount
        string category
    }
    BOOKINGS {
        int booking_id PK
        string user_id
        int trip_id FK
        string booking_type
        decimal amount
        string status
    }

    %% DATABASE: yatra_team
    AGENCIES_MASTER {
        int id PK
        string agency_id UK
        string agency_name
        string email
        string plan_type
        string subscription_status
    }
    TRAVELLERS_MASTER {
        int id PK
        string user_id UK
        string full_name
        string email
        int total_trips
    }
    SUPPORT_TICKETS {
        int ticket_id PK
        string reporter_id
        string subject
        string priority
        string status
    }

    %% RELATIONSHIPS
    TOURS ||--o{ TOUR_STOPS : "contains"
    TOURS ||--o{ AGENCY_EXPENSES : "incurs"
    TRAVELLER_TRIPS ||--o{ TRAVELLER_EXPENSES : "tracks"
    TRAVELLER_TRIPS ||--o{ BOOKINGS : "includes"
    AGENCIES_MASTER ||--o{ SUPPORT_TICKETS : "submits"
    TRAVELLERS_MASTER ||--o{ SUPPORT_TICKETS : "submits"
```

---

## 5. OTP Authentication & Verification Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Partner
    participant FE as Frontend React App
    participant API as Auth API (:8003)
    participant DB as MySQL (yatra_agency / yatra_team)
    participant NOTIF as Notification Service
    participant SMTP as Gmail SMTP Server

    User->>FE: Select Role (Agency / Traveller / Admin) & Enter Email
    FE->>API: POST /auth/send-otp { email, portal }
    API->>DB: Query account existence & credentials
    DB-->>API: User record found / initialized
    API->>API: Generate 6-Digit Secure OTP Code
    API->>NOTIF: Dispatch OTP request
    NOTIF->>SMTP: Send Email via smtplib
    SMTP-->>User: Receive OTP Email (e.g. 508277)
    API-->>FE: HTTP 200 { success: true, message: "OTP sent" }
    
    User->>FE: Enter 6-digit OTP code in Modal
    FE->>API: POST /auth/verify-otp { email, otp, portal }
    API->>API: Validate OTP & expiration timestamp
    alt Valid OTP
        API-->>FE: HTTP 200 { authenticated: true, token: "JWT...", user: {...} }
        FE->>FE: Save session in localStorage
        FE-->>User: Redirect to Portal Dashboard
    else Invalid / Expired OTP
        API-->>FE: HTTP 400 { error: "Invalid or expired verification code" }
        FE-->>User: Display error notification
    end
```

---

## 6. Tour Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> Draft: Partner creates tour shell
    Draft --> AiGenerated: Trigger AI Itinerary Generator
    AiGenerated --> Scheduled: Review timeline & assign vehicle/driver
    Draft --> Scheduled: Manual schedule setup
    Scheduled --> InProgress: Start date reached / Departure
    InProgress --> Completed: Journey ends & invoices settled
    Scheduled --> Cancelled: Tour cancelled by agency/customer
    InProgress --> Cancelled: Emergency cancellation
    Completed --> [*]
    Cancelled --> [*]
```
