# YATRA — Architecture Diagram

> AI-powered travel management platform with three role-based portals and a microservices backend.

---

## High-Level System Architecture

```mermaid
flowchart TD
    subgraph CLIENT["🖥️  Frontend  (Vite + React)"]
        direction TB
        LP["Landing Portal\nRole Selection / Auth"]
        AP["Agency Portal\n(Port-gated SPA)"]
        UP["User / Traveller Portal\n(Port-gated SPA)"]
        TP["Yatra Team Admin Portal\n(Port-gated SPA)"]
        SVC["services/api.js\nHTTP Client Layer"]
        LP -->|select role| AP & UP & TP
        AP & UP & TP --> SVC
    end

    subgraph BACKEND["⚙️  Backend  (Python · FastAPI · Uvicorn)"]
        direction TB
        AA["agency_api.py\n:8000"]
        TA["traveller_api.py\n:8001"]
        TMA["team_api.py\n:8002"]
        EM["email_helper.py\nSMTP / OTP"]
        SM["sms_helper.py\nSMS / OTP"]
        MH["mysql_helper.py\nDB Connection Pool"]
        RB["run_backend.py\nProcess Orchestrator"]
        RB --> AA & TA & TMA
        AA & TA & TMA --> MH
        AA & TA --> EM
        AA --> SM
    end

    subgraph DB["🗄️  MySQL  (3 isolated databases)"]
        direction LR
        DBA["yatra_agency\ntours · stops · timeline\nexpenses · vehicles\ndrivers · customers\nnotifications · settings"]
        DBT["yatra_traveller\ntrips · expenses\nbookings · documents\nprofile"]
        DBM["yatra_team\nagencies · travellers\npayments · subscriptions\ntickets · logs"]
    end

    subgraph EXT["☁️  External Services"]
        SMTP["Gmail SMTP\nOTP Emails"]
        AI["AI / LLM\nItinerary Generator"]
    end

    SVC -->|REST :8000| AA
    SVC -->|REST :8001| TA
    SVC -->|REST :8002| TMA

    MH --> DBA & DBT & DBM
    EM --> SMTP
    AA -->|POST /ai-itinerary| AI
```

---

## Frontend — Portal & Component Breakdown

```mermaid
flowchart LR
    subgraph APP["App.jsx  (Root Router)"]
        direction TB
        LAND["LandingPortal.jsx\nHero · Auth · OTP flow"]
        subgraph AGENCY["AgencyPortal"]
            D1["DashboardPage"]
            D2["ToursPage / TourDetailPage"]
            D3["ExpensesPage"]
            D4["InvoicePage"]
            D5["VehiclesPage"]
            D6["DriversPage"]
            D7["AiItineraryPage"]
            D8["ReportsPage / AnalyticsPage"]
        end
        subgraph USER["UserPortal"]
            U1["Dashboard"]
            U2["Trips"]
            U3["Expenses"]
            U4["AI Assistant"]
            U5["Feedback / Reviews"]
        end
        subgraph TEAM["TeamPortal"]
            T1["Platform Overview"]
            T2["Agencies List"]
            T3["Travellers List"]
            T4["Revenue"]
            T5["Analytics / Health"]
        end
        SHARED["Shared Components\nHeader.jsx · Sidebar.jsx"]
    end

    LAND --> AGENCY & USER & TEAM
    SHARED --> AGENCY & USER & TEAM
```

---

## Backend — API Endpoints Summary

```mermaid
flowchart TD
    subgraph A8000["agency_api.py  :8000"]
        A1["/auth/send-otp  POST"]
        A2["/auth/verify-otp  POST"]
        A3["/dashboard/summary  GET"]
        A4["/tours  GET · POST"]
        A5["/tours/:id  GET · PUT · DELETE"]
        A6["/tours/:id/journey  GET · PUT"]
        A7["/tours/:id/timeline  GET · POST"]
        A8["/expenses  GET · POST"]
        A9["/vehicles  GET · POST · PUT · DELETE"]
        A10["/drivers  GET · POST · DELETE"]
        A11["/invoices  GET"]
        A12["/ai-itinerary  POST"]
        A13["/reports  GET"]
        A14["/notifications  GET · PUT"]
    end

    subgraph T8001["traveller_api.py  :8001"]
        B1["/auth/send-otp  POST"]
        B2["/auth/verify-otp  POST"]
        B3["/dashboard/summary  GET"]
        B4["/trips  GET · POST"]
        B5["/expenses  GET · POST · DELETE"]
        B6["/bookings  GET · POST"]
        B7["/documents  GET · POST"]
        B8["/profile  GET · PUT"]
    end

    subgraph M8002["team_api.py  :8002"]
        C1["/dashboard/summary  GET"]
        C2["/agencies  GET · PUT"]
        C3["/travellers  GET"]
        C4["/payments  GET"]
        C5["/subscriptions  GET"]
        C6["/analytics  GET"]
        C7["/support/tickets  GET · PUT"]
        C8["/health  GET"]
        C9["/ai-usage  GET"]
        C10["/logs  GET"]
    end
```

---

## Database Schema — Entity Relationships

```mermaid
erDiagram
    %% yatra_agency
    TOURS {
        int trip_id PK
        string agency_id
        string destination
        string status
        decimal budget
    }
    TOUR_STOPS {
        int id PK
        int trip_id FK
        string name
        decimal lat
        decimal lng
    }
    EXPENSES_A {
        int expense_id PK
        int trip_id FK
        string agency_id
        decimal amount
        string category
    }
    VEHICLES {
        string vehicle_number PK
        string agency_id
        string model
        string availability
    }
    DRIVERS {
        int driver_id PK
        string agency_id
        string name
        decimal ratings
    }

    %% yatra_traveller
    TRIPS {
        int id PK
        string user_id
        string name
        decimal budget
    }
    EXPENSES_T {
        int id PK
        string user_id
        string title
        decimal amount
    }
    BOOKINGS {
        int id PK
        string user_id
        int trip_id FK
        string status
    }

    %% yatra_team
    AGENCIES {
        int id PK
        string agency_id
        string name
        string subscription_status
    }
    TRAVELLERS_M {
        int id PK
        string user_id
        int trips_count
        int ai_usage_tokens
    }
    SUPPORT_TICKETS {
        int id PK
        int agency_id FK
        int traveller_id FK
        string status
    }

    TOURS ||--o{ TOUR_STOPS : "has"
    TOURS ||--o{ EXPENSES_A : "incurs"
    TRIPS ||--o{ BOOKINGS : "has"
    AGENCIES ||--o{ SUPPORT_TICKETS : "raises"
    TRAVELLERS_M ||--o{ SUPPORT_TICKETS : "raises"
```

---

## Auth Flow — OTP Login

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as Frontend (React)
    participant API as FastAPI (/auth)
    participant DB as MySQL
    participant SMTP as Gmail SMTP

    U->>FE: Enter email / agency_id
    FE->>API: POST /auth/send-otp
    API->>DB: Check if user/agency exists
    DB-->>API: OK / Not found
    API->>SMTP: Send 6-digit OTP email
    SMTP-->>U: Email with OTP
    U->>FE: Enter OTP
    FE->>API: POST /auth/verify-otp
    API->>API: Validate OTP (in-memory store)
    API-->>FE: { agency_id / user_id, ... }
    FE->>FE: Store in localStorage
    FE-->>U: Navigate to Portal
```

---

## Technology Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + Vite |
| **Frontend Styling** | Vanilla CSS (custom design system) |
| **Backend Framework** | FastAPI (Python) |
| **ASGI Server** | Uvicorn |
| **Database** | MySQL (3 databases) |
| **Auth** | Email OTP (in-memory store) |
| **Email** | Gmail SMTP via `smtplib` |
| **SMS** | sms_helper (pluggable) |
| **AI** | External LLM (itinerary generation) |
| **Process Mgmt** | `run_backend.py` subprocess orchestrator |
