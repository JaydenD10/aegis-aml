# AegisAML - Dynamic AML Risk Intelligence

AegisAML is a comprehensive Anti-Money Laundering (AML) investigation platform designed for compliance analysts. It bridges the gap between raw machine learning fraud detection and human-centric financial crime investigation.

## Project Architecture

AegisAML operates on a decoupled architecture designed for performance and separation of concerns.

```text
ML Pipeline
↓
PostgreSQL
↓
FastAPI (Backend)
↓
Next.js (Frontend)
↓
AegisAML Analyst
```

### Technology Stack
- **Database**: PostgreSQL (handling ~1.32M transactions, 10K accounts, and ~400K ML predictions).
- **Backend**: FastAPI with SQLAlchemy ORM.
- **Frontend**: Next.js 14 (App Router) with React, Tailwind CSS, shadcn/ui, and ReactFlow.

## Features & Modules

- **Command Center Dashboard**: Live KPIs and dynamic risk distributions.
- **Entity Intelligence**: Deep dives into specific accounts and transactions.
- **Network Analysis**: Interactive ReactFlow-based visualization of transactional relationships (bounded query architecture).
- **Behavioral Drift Detection**: Real-time rendering of ML drift events across four detectors (Page-Hinkley, CUSUM, KS Test, Z-Score).
- **Explainable AI (SHAP)**: Granular transparency into why a transaction was flagged, mapping risk-increasing and risk-decreasing drivers.
- **Investigation Workspace**: Complete case management, analyst notes, decision tracking, and alert triaging.
- **Immutable Audit Log**: Append-only tracking of all analyst interactions.

## How to Start the Application

### 1. Database
Ensure PostgreSQL is running locally on port `5432` with the database `aegisaml` and the credentials specified in your `backend/.env` file. 

### 2. Backend (FastAPI)
Open a terminal in the root directory:
```bash
cd backend
# Create virtual environment if needed: python -m venv venv
# pip install -r requirements.txt
uvicorn main:app --port 8000
```
*The backend automatically manages schema creation on startup using SQLAlchemy.*

### 3. Frontend (Next.js)
Open a separate terminal:
```bash
cd frontend
# Install dependencies if needed: npm install
npm run dev
```

The application is now accessible at [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/aegisaml
```

## Known Limitations

1. **DiCE Counterfactuals**: Record-level counterfactual outputs were not retained by the original ML pipeline. The UI correctly states that the explanation is unavailable for records.
2. **Network Analysis Limits**: To maintain DOM performance and prevent browser crashes, the ReactFlow neighborhood graph uses a bounded query limit (50 nearest edges) rather than rendering the entire 1.32 million transaction edge space.
3. **PDF Generation**: True native PDF binary rendering is not implemented server-side. The application relies on browser-level "Print / Save as PDF" using optimized print CSS stylesheets.
