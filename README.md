# ROAD-WATCH 
**Real-time detection. Real-world safety.**

ROAD-WATCH is an AI-driven civic tech platform designed to empower citizens and municipal authorities with real-time infrastructure monitoring. Built for the IIT Madras Road Safety Hackathon, this system leverages Google's Gemini 2.5 AI to automatically evaluate road hazards, filter out spam, and algorithmically prioritize municipal repair budgets.

---

## 📖 Project Overview

Municipal dashboards are traditionally flooded with duplicate reports, unverified claims, and non-actionable data. ROAD-WATCH solves the civic data bottleneck through two core innovations:

1. **Gemini AI Anti-Spam Shield (Chain-of-Thought):** Uploaded images are strictly parsed by AI. If a user uploads a selfie, a coffee cup, or an irrelevant image, the AI generates a step-by-step reasoning logic and instantly rejects it, keeping the municipal ledger clean. Valid hazards are automatically assigned severity and impact scores.
2. **Algorithmic De-duplication:** Instead of discarding duplicate reports, the backend computes the MD5 hash of incoming images. When an exact duplicate is detected, it automatically halts the upload to prevent spam and organically boosts civic priority.

---

## 🏗️ System Architecture

### Tech Stack
- **Frontend:** Next.js 16 / React 19, Tailwind CSS (v4), React-Leaflet (v5), Recharts
- **Backend:** FastAPI (Python), Asyncio, SQLAlchemy
- **Database & Storage:** Supabase (PostgreSQL), Supabase Storage buckets
- **AI Engine:** Google Gemini 2.5 Flash API (via `google-genai` SDK)

### High-Level Architecture Diagram
```mermaid
graph TD
    Client[Frontend Client / Citizen] -->|Uploads Image & GPS| API[FastAPI Backend]
    
    subgraph Backend Engine
        API --> Hash[MD5 Image Hashing]
        Hash -->|Duplicate| Reject[Reject / Flag as Duplicate]
        Hash -->|Unique| AI[Google Gemini 2.5 AI]
        
        AI -->|Generates CoT Reasoning| Triage{Is Infrastructure?}
        Triage -- No --> Fail[Reject: AI Validation Failed]
        Triage -- Yes --> Extract[Extract: Severity, Type, Score]
    end
    
    Extract --> DB[(Supabase PostgreSQL)]
    Extract --> Storage[(Supabase Storage)]
    
    DB --> Dashboard[Municipal Dashboard]
    DB --> Map[Public Safety Map]
```

---

## ⚙️ Core Workflows

### 1. AI Image Validation Flow
When a user submits a hazard, the system does not blindly trust the user. It enforces a rigorous, multi-stage validation pipeline:
```mermaid
sequenceDiagram
    participant User
    participant Backend
    participant Gemini AI
    participant Supabase
    
    User->>Backend: Submit Report (Image + GPS)
    Backend->>Backend: Generate MD5 Hash
    Backend->>Supabase: Check if Hash Exists
    alt Hash Exists
        Supabase-->>Backend: Duplicate Found
        Backend-->>User: 409 Conflict (Duplicate)
    else Unique Hash
        Backend->>Supabase: Upload Image to Storage Bucket
        Backend->>Gemini AI: Request Image Analysis (Prompt + Schema)
        Gemini AI-->>Backend: JSON (Reasoning, is_road_damage, severity, type)
        alt is_road_damage == false
            Backend->>Supabase: Delete Image from Storage
            Backend-->>User: 400 Bad Request (AI Rejection)
        else is_road_damage == true
            Backend->>Supabase: Insert Report Record
            Backend-->>User: 201 Created (Success)
        end
    end
```

---

## ✨ Key Features

*   **Intelligent Triage & Scoring:** Automatically calculates an `impact_score` based on AI damage assessment and community upvotes.
*   **Interactive Safety Map:** A dynamic Leaflet map featuring hazard pins and "Safety Routing" overlays to bypass pothole clusters.
*   **Municipal Dashboard:** A clean, high-contrast control center for city planners featuring real-time budget tuning, hazard severity analytics, and AI verification modals.
*   **Civic Gamification:** Users unlock credentials as they submit precise GPS locations and verify active reports.
*   **Automated Challan Generation:** Generates official municipal repair request PDFs directly from the dashboard.

---

## 🚀 Installation & Setup

### Prerequisites
*   Node.js (v20+)
*   Python (3.10+)
*   Google Gemini API Key
*   Supabase Account (Database & Storage)

### 1. Clone the Repository
```bash
git clone https://github.com/AbhinaySingh2/ROAD-WATCH.git
cd ROAD-WATCH
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies.
```bash
cd backend
python -m venv venv
# On Windows use: venv\Scripts\activate
# On Mac/Linux use: source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory. **This is strictly required for the backend to function.**
```env
# backend/.env
GEMINI_API_KEY="your_google_gemini_api_key_here"
SECRET_KEY="dev_secret_change_me"
ADMIN_EMAIL="admin@roadwatch.com"
ADMIN_PASSWORD="hackathon2024"
CORS_ALLOW_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# Supabase Credentials (Get these from your Supabase Project Settings)
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your-anon-or-service-role-key"
DATABASE_URL="postgresql+asyncpg://postgres:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```
*(Note: If you run `uvicorn` from the root directory instead of the backend folder, use `uvicorn backend.app.main:app --reload --port 8000`. The system will automatically locate the backend/.env file).*

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory.
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

---

## 🔮 Future Roadmap

*   **Passive IoT Scanning:** Develop custom kernel-level drivers to integrate the AI detection pipeline directly with public transit dashcams, enabling automated, human-free hazard scanning across the city.
*   **Predictive Infrastructure Policy:** Analyze historical degradation data to predict future road failures, allowing municipalities to transition from reactive repairs to preventative maintenance.
*   **Automated Contractor Bidding:** Allow registered contractors to bid on grouped hazard clusters directly through the municipal dashboard.

---

## 👥 Team: APEX CODER

*   **Team Leader:** Aayushi Kumari
*   **Members:** 
    *   Akriti Verma
    *   Adiba Aafrin
    *   Anubha Gupta
    *   Roshni Ghosh
    *   Abhinay Kumar Singh
    *   Debjyoti Dasgupta
    *   Shreyansh Gopal
