
# ROAD-WATCH 
**Real-time detection. Real-world safety.**

ROAD-WATCH is an AI-driven civic tech platform designed to empower citizens and municipal authorities with real-time infrastructure monitoring. Built for the IIT Madras Road Safety Hackathon, this system leverages Google's Gemini 2.5 AI to automatically evaluate road hazards, filter out spam, and algorithmically prioritize municipal repair budgets.

---

##  The Edge: Why ROAD-WATCH Stands Out

Municipal dashboards are traditionally flooded with duplicate reports, unverified claims, and non-actionable data. ROAD-WATCH solves the civic data bottleneck through two core innovations:

*   **Gemini AI Anti-Spam Shield:** Uploaded images are strictly parsed by AI. If a user uploads a selfie, a coffee cup, or an irrelevant image, the system instantly rejects it, keeping the municipal ledger clean. Valid hazards are automatically assigned severity and impact scores.
*   **Algorithmic De-duplication:** Instead of discarding duplicate reports, the backend computes the MD5 hash of incoming images. When a duplicate is detected, it automatically converts the submission into an **upvote** for the original report, organically boosting its civic priority.

---

##  Key Features

*   **Intelligent Triage & Scoring:** Automatically calculates an `impact_score` based on AI damage assessment and community upvotes.
*   **Interactive Safety Map:** A dynamic Leaflet map featuring AI predictive heatmap circles and "Safety Routing" overlays to bypass hazardous pothole clusters.
*   **Municipal Dashboard:** A clean, high-contrast control center for city planners featuring real-time budget tuning, hazard severity analytics, and a live retro-terminal activity stream.
*   **Civic Gamification:** Users unlock credentials (e.g., *Pothole Patrol*, *Civic Commander*) as they submit precise GPS locations and verify active reports.

---

##  Tech Stack

**Frontend**
*   **Framework:** Next.js 16 / React 19
*   **Styling:** Tailwind CSS (v4) with custom CRT/Cyberpunk CSS animations
*   **Mapping:** React-Leaflet (v5)
*   **Data Visualization:** Recharts

**Backend & AI**
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite / SQLAlchemy (Async)
*   **AI Engine:** Google Gemini 2.5 Flash API
*   **File Handling:** Local aiofiles (with MD5 hashing)

---

##  Installation & Setup

### Prerequisites
*   Node.js (v20+)
*   Python (3.8+)
*   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/road-watch.git
cd road-watch
```

### 2. Backend Setup
Navigate to the backend directory, create a virtual environment, and install dependencies.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory and add your API key:
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
CORS_ALLOW_ORIGINS=http://localhost:3000
```

Start the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

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
Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

##  Future Roadmap

*   **Phase 1: Database Migration:** Transition to **PostgreSQL with PostGIS** for high-efficiency spatial radius queries and migrate ephemeral local image storage to **AWS S3** or Google Cloud Storage.
*   **Phase 2: Passive IoT Scanning:** Develop custom kernel-level drivers to integrate the AI detection pipeline directly with public transit dashcams, enabling automated, human-free hazard scanning across the city.
*   **Phase 3: Predictive Infrastructure Policy:** Analyze historical degradation data to predict future road failures, allowing municipalities to transition from reactive repairs to preventative maintenance.

---

##  Team: APEX CODER

*   **Team Leader:** Aayushi Kumari
*   **Members:** 
    *   Akriti Verma
    *   Adiba Aafrin
    *   Anubha Gupta
    *   Roshni Ghosh
    *   Abhinay Kumar Singh
    *   Debjyoti Dasgupta
    *   Shreyansh Gopal
