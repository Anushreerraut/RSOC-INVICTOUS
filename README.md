# 🛡️ RSOC — Automated API Security Scanner

> An intelligent, real-time API vulnerability scanner built on the **OWASP API Top 10** framework. Scan any API, detect critical vulnerabilities, and generate instant security reports — all from a beautiful web dashboard.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **7 Scanner Modules** | Auth, Injection, Rate Limiting, Data Exposure, Misconfiguration, WAF/IPS/IDS Detection, Mass Assignment |
| 📊 **Live Dashboard** | Real-time stats, severity charts, and recent scan activity |
| ⚡ **Real-time Scan Progress** | Watch vulnerabilities appear live as the scan runs |
| 📋 **Detailed Findings** | Full HTTP request/response proof + CVSS scores + OWASP references |
| 🔎 **Search & Filter** | Filter findings by severity, scan, or keyword |
| ⬇️ **CSV Export** | One-click downloadable vulnerability reports |
| 🗑️ **History Management** | Delete individual scans or clear all history |
| 🛡️ **WAF/IPS/IDS Detection** | Detects Cloudflare, AWS WAF, ModSecurity, and other active defenses |
| 📖 **User Manual** | Built-in interactive guide for new users |
| 💬 **Review System** | Submit feedback and suggestions directly from the dashboard |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Clone the repository
```bash
git clone https://github.com/Anushreerraut/RSOC-INVICTOUS.git
cd RSOC-INVICTOUS
```

### 2. Start everything (Windows)
```bash
START_ALL.bat
```

This launches both the **backend** (port 8000) and **frontend** (port 5173) automatically.

### 3. Open the dashboard
```
http://localhost:5173
```

---

## 🏗️ Architecture

```
RSOC/
├── backend/                    # FastAPI Python backend
│   └── app/
│       ├── api/routes/         # REST API endpoints (scans, findings, reviews)
│       ├── models/             # SQLAlchemy database models (scan, finding, review)
│       ├── scanner/
│       │   ├── engine.py       # Core scanning orchestrator
│       │   └── modules/        # Individual scanner modules
│       │       ├── auth.py             # Authentication checks
│       │       ├── injection.py        # SQLi, SSRF, Path Traversal
│       │       ├── rate_limit.py       # Rate limiting detection
│       │       ├── data_exposure.py    # PII and secret detection
│       │       ├── misconfiguration.py # CORS, security headers
│       │       ├── waf_detector.py     # WAF/IPS/IDS fingerprinting
│       │       └── mass_assignment.py  # OWASP API6:2023 detection
│       └── core/               # Database, config, middleware
├── rsoc-ui/                    # React + TypeScript frontend
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx   # Security posture overview
│       │   ├── NewScan.tsx     # Scan launcher + live progress
│       │   ├── Scans.tsx       # Scan history + delete all
│       │   ├── Findings.tsx    # Vulnerability explorer + CSV export
│       │   ├── Targets.tsx     # Saved API targets
│       │   └── Manual.tsx      # User guide
│       └── api.ts              # API client
└── START_ALL.bat               # One-click launcher
```

---

## 🔒 OWASP API Top 10 Coverage

| ID | Vulnerability | Status |
|---|---|---|
| API1 | Broken Object Level Authorization | ✅ Covered |
| API2 | Broken Authentication | ✅ Covered |
| API4 | Unrestricted Resource Consumption (Rate Limiting) | ✅ Covered |
| API6 | Unrestricted Access to Sensitive Business Flows (Mass Assignment) | ✅ Covered |
| API7 | Server Side Request Forgery (SSRF) | ✅ Covered |
| API8 | Security Misconfiguration | ✅ Covered |

---

## 🧪 Running a Scan

1. Go to **New Scan** in the sidebar
2. Enter a **Target URL** (e.g., `https://api.example.com`)
3. Optionally paste an **OpenAPI/Swagger spec** for deeper coverage
4. Click **🔍 Launch Scan**
5. Watch the real-time progress tracker as findings appear live
6. Navigate to **Findings** to view detailed vulnerability reports
7. Click **⬇️ Export CSV** to download a report

---

## 🛠️ Manual Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd rsoc-ui
npm install
npm run dev
```

---

## 🧩 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Recharts |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| HTTP Client | httpx (async) |
| Styling | Vanilla CSS (Dark Glassmorphism) |

---

## 📸 Screenshots

> Dashboard → New Scan → Real-time Progress → Findings → CSV Export

---

## 👩‍💻 Team

**RSOC** — Built for INVICTUS Hackathon

---

## 📄 License

MIT License — free to use, modify, and distribute.