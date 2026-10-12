# AI Smart City Management System

A full-stack, software-only web application for municipal management, complaint triage, and predictive city analytics powered by **FastAPI**, **React.js (Vite)**, **Scikit-Learn/NumPy Machine Learning**, and **MySQL**.

> [!NOTE]
> **Hard Constraint Enforced**: Software-only application. Uses no physical hardware, cameras, or sensors. All predictions rely on classical ML models trained on synthetic municipal datasets.

---

## 🚀 Key Modules Built

1. **Citizen Complaint Portal**: Signup/Login (JWT), submit complaints with text description, location, zone selection, photo attachment upload, and live status tracking timeline.
2. **AI Complaint Classification**: Classical NLP model (TF-IDF + Naive Bayes) that automatically classifies complaint descriptions into categories (`Traffic`, `Waste Management`, `Pollution`, `Infrastructure`).
3. **Priority & Escalation Detection**: Urgency scoring model flagging critical issues (`High`, `Medium`, `Low`) based on hazard keywords and complaint density.
4. **Traffic Congestion Prediction**: Regression model forecasting road segment congestion % based on zone, hour of day, day of week, and weather conditions.
5. **Waste Generation Prediction**: Regression model forecasting daily waste volume in tons per zone and recommending collection truck fleet dispatch counts.
6. **Pollution (AQI) Prediction**: Regression model predicting Air Quality Index (AQI), PM2.5, NO2 levels per zone, and issuing public health advisories.
7. **Admin Command & Analytics Dashboard**: JWT-protected admin portal with interactive City Zone map (Leaflet), Recharts analytics graphs, and complaint triage table with status toggling (`Open` -> `In Progress` -> `Resolved`).

---

## 🔑 Pre-Seeded Demo Credentials

The database comes pre-populated with demo accounts and ~30 realistic complaints across 5 city zones:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **City Administrator** | `admin@smartcity.gov` | `Admin@123` | Full Admin Dashboard & Triage Operations |
| **Citizen Resident** | `citizen@city.org` | `Citizen@123` | Citizen Complaint Portal & Status Tracker |

---

## 📂 Project Directory Structure

```text
Capstone Project/
├── database/
│   ├── schema.sql              # MySQL DDL table schema
│   └── seed.py                 # Initial database seeder script
├── ml/
│   ├── generate_data.py        # Generates synthetic municipal CSV datasets
│   ├── train_models.py         # Trains classical ML pipelines & exports joblib artifacts
│   ├── custom_ml.py            # Custom classical TF-IDF, Naive Bayes & Ridge ML algorithms
│   ├── data/                   # Generated synthetic CSV datasets
│   └── models/                 # Exported model artifacts (.joblib)
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entry point & CORS
│   │   ├── config.py           # Configuration settings
│   │   ├── database.py         # SQLAlchemy engine & session manager
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── auth.py             # JWT authentication & password hashing
│   │   ├── ml_service.py       # ML model inference singleton
│   │   └── routers/            # Auth, Complaints, Admin, and Prediction routers
│   ├── uploads/                # Photo evidence uploads
│   ├── tests/                  # Pytest test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/              # Citizen & Admin pages, Prediction modules
│   │   ├── components/         # Navbar, CityMap, Protected routes
│   │   ├── context/            # AuthContext
│   │   └── services/           # Axios API client
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Step-by-Step Local Setup Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & NPM
- MySQL Server (optional; if MySQL service is not running locally, backend automatically falls back to local SQLite for seamless zero-config demoing!)

### Step 1: Install Python Backend Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 2: Generate Datasets & Train ML Models
```bash
# 1. Generate synthetic CSV datasets
python ml/generate_data.py

# 2. Train classical ML models & save artifacts (.joblib)
python ml/train_models.py
```

### Step 3: Seed Database
```bash
python database/seed.py
```

### Step 4: Start FastAPI Backend Server
```bash
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```
- Interactive Swagger API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 5: Start React Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker Deployment (Optional)

Run the complete containerized stack using Docker Compose:
```bash
docker-compose up --build
```

---

## 🧪 Running Automated Tests

```bash
pytest backend/tests/test_api.py
```
