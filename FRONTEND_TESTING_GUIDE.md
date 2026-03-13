# RSOC Frontend Testing Guide
> Test all 5 tabs of the RSOC API Security Scanner UI at **http://localhost:5173**
>
> Backend must be running on **http://localhost:8000**

---

## ✅ Pre-flight Checklist

Before opening the browser, ensure both servers are running:

| Service | URL | How to Start |
|---|---|---|
| Backend | http://localhost:8000 | `cd backend && python -m uvicorn app.main:app --reload` |
| Frontend | http://localhost:5173 | `cd rsoc-ui && npm run dev` |

Verify the backend is alive:
```
http://localhost:8000/docs
```
You should see the Swagger UI. If not, start the backend first.

---

## Tab 1: 📊 Dashboard

**What it shows:** Live stats, recent scans summary, severity chart.

### Steps
1. Open http://localhost:5173 — the app opens directly on Dashboard.
2. You should see stat cards (Total Scans, Findings, Critical, High).
3. If no data yet, the charts will show zeros — that's expected until you run a scan.

### After running a scan, come back to Dashboard to see:
- Total scan count
- Severity breakdown chart (Critical / High / Medium / Low / Info)
- Recent scans list with risk scores

---

## Tab 2: 🎯 Targets (Add this FIRST before scanning)

**What it does:** Saves reusable API targets with auth credentials.

### Steps
1. Click **Targets** in the left sidebar.
2. Click **+ Add Target**.
3. Fill in the form with the example below and click **Save Target**.

### ✅ Example 1 — Public API (No Auth)
| Field | Value |
|---|---|
| Name | `JSONPlaceholder` |
| Base URL | `https://jsonplaceholder.typicode.com` |
| Auth Type | `None` |
| Description | `Free fake REST API for testing` |

### ✅ Example 2 — API with Bearer Token
| Field | Value |
|---|---|
| Name | `My Secure API` |
| Base URL | `https://api.example.com` |
| Auth Type | `Bearer Token` |
| Bearer Token | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test` |
| Description | `Production API with JWT auth` |

### ✅ Example 3 — API Key Auth
| Field | Value |
|---|---|
| Name | `Weather API` |
| Base URL | `https://api.openweathermap.org` |
| Auth Type | `API Key` |
| API Key | `abc123def456ghi789` |
| Description | `OpenWeatherMap public API` |

**Expected result:** Targets appear in the table with Name, Base URL, Auth type, and Delete button.

---

## Tab 3: 🚀 New Scan (The core feature)

**What it does:** Launches a security scan against an API endpoint.

### Steps
1. Click **New Scan** in the left sidebar.
2. Fill in the Target URL and choose Scan Type.
3. Click **🔍 Launch Scan**.
4. On success you'll see: `✅ Scan started! ID: xxxxxxxx... — Status: running`

---

### ✅ Example A — Quick URL Scan (simplest)
| Field | Value |
|---|---|
| Target URL | `https://jsonplaceholder.typicode.com` |
| Scan Type | `URL / Endpoint Discovery` |

> This scans a real public REST API. Great for a quick demo.

---

### ✅ Example B — OpenAPI / Swagger Spec Scan
| Field | Value |
|---|---|
| Target URL | `https://petstore3.swagger.io/api/v3` |
| Scan Type | `OpenAPI / Swagger Spec` |

Paste the following into the **OpenAPI Spec** textarea that appears:

```yaml
openapi: 3.0.0
info:
  title: Pet Store API
  version: 1.0.0
paths:
  /pet:
    get:
      summary: Get all pets
      responses:
        '200':
          description: OK
  /user/login:
    get:
      summary: User login
      parameters:
        - name: username
          in: query
          schema:
            type: string
        - name: password
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Login successful
  /user/{username}:
    get:
      summary: Get user by name
      parameters:
        - name: username
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: OK
```

---

### ✅ Example C — GraphQL Scan
| Field | Value |
|---|---|
| Target URL | `https://countries.trevorblades.com/graphql` |
| Scan Type | `GraphQL` |

> A public GraphQL API for country data. Tests GraphQL-specific vulnerabilities.

---

### ✅ Example D — Postman Collection Scan
| Field | Value |
|---|---|
| Target URL | `https://api.restful-api.dev` |
| Scan Type | `Postman Collection` |

---

## Tab 4: 📋 Scan History

**What it shows:** All past and running scans with risk scores and finding counts.

### Steps
1. Click **Scan History** in the left sidebar.
2. After running scans from Tab 3, they appear here.
3. Click **↻ Refresh** to update statuses.
4. Each row shows:
   - Target URL
   - Scan type badge
   - Status (running / completed / failed)
   - Risk score bar (0–100)
   - Total findings
   - C/H/M/L breakdown (Critical / High / Medium / Low)
   - Duration
   - Delete button

### Status meanings
| Status | Meaning |
|---|---|
| `running` | Scan is in progress |
| `completed` | Scan finished successfully |
| `failed` | Scan encountered an error |

---

## Tab 5: ⚠️ Findings

**What it shows:** All vulnerabilities discovered across all scans, with filters.

### Steps
1. Click **Findings** in the left sidebar.
2. After completing at least one scan, findings appear here.
3. **Filter by scan:** Use the "All Scans" dropdown to focus on one scan.
4. **Filter by severity:** Use the "All Severities" dropdown, or click a severity card at the top.
5. **Click any finding row** to open the detail modal showing:
   - Severity badge + OWASP reference + CVSS score
   - Full description
   - Remediation advice
   - Raw HTTP request/response (if captured)

### Severity levels
| Badge | Colour | Meaning |
|---|---|---|
| `critical` | Red | Immediate action required |
| `high` | Orange | Fix before next release |
| `medium` | Yellow | Fix in next sprint |
| `low` | Green | Low risk, fix when possible |
| `info` | Blue | Informational only |

---

## 🔁 Full End-to-End Test Walkthrough

Follow this order for a complete simulation:

```
1. [Targets]      → Add "JSONPlaceholder" target (no auth)
2. [New Scan]     → Scan https://jsonplaceholder.typicode.com (URL type)
3. [Scan History] → Refresh until status = "completed"
4. [Findings]     → Review discovered vulnerabilities
5. [Dashboard]    → Confirm stats updated (scan count, severity chart)
```

---

## 🛠️ Common Issues & Fixes

| Problem | Fix |
|---|---|
| Dashboard shows 0 everywhere | Run a scan first, then refresh |
| "Failed to start scan" error | Make sure backend is running on port 8000 |
| Scan stays "running" forever | Check backend terminal for Python errors |
| Findings tab shows empty | Wait for scan to complete, then click a severity card |
| Frontend blank page | Open browser console (F12) and check for JS errors |

---

## 🌐 Useful Backend API Endpoints (for manual testing)

| Endpoint | Method | Purpose |
|---|---|---|
| `/docs` | GET | Swagger UI |
| `/scans` | GET | List all scans |
| `/scans` | POST | Start a new scan |
| `/findings` | GET | List all findings |
| `/targets` | GET | List all targets |
| `/targets` | POST | Add a new target |

Access at: **http://localhost:8000/docs**
