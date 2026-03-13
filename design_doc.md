# System Design Document
# Automated API Security Scanner

**Version:** 1.0  
**Date:** 2026-03-13  

---

## 1. Architecture Overview

The scanner is designed as a **microservices-based SaaS platform** with a standalone CLI. Components communicate via async message queues for resilience and scalability.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│   [ CLI Tool ]   [ Web Dashboard (React) ]   [ REST API ]       │
└────────────┬─────────────────┬──────────────────┬───────────────┘
             │                 │                  │
             ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway (FastAPI)                      │
│   Auth (JWT/OAuth2) · Rate Limiting · Request Routing            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┼────────────────────┐
         ▼                     ▼                    ▼
┌─────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│  Scan Scheduler  │  │  Auth Service    │  │  Report Service    │
│  (Celery+Redis)  │  │  (User/Org/Keys) │  │  (PDF/HTML/JSON)   │
└────────┬─────────┘  └──────────────────┘  └────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Scan Engine Workers (Celery)                   │
│                                                                   │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │  Discovery │  │  Auth Check │  │  Injection   │              │
│  │  Module    │  │  Module     │  │  Module      │              │
│  └────────────┘  └─────────────┘  └──────────────┘              │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐              │
│  │  Rate Limit│  │  Data Expo- │  │  Misconfig   │              │
│  │  Module    │  │  sure Module│  │  Module      │              │
│  └────────────┘  └─────────────┘  └──────────────┘              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼──────────────┐
              ▼             ▼              ▼
       ┌───────────┐  ┌──────────┐  ┌──────────────┐
       │ PostgreSQL│  │  Redis   │  │ Elasticsearch│
       │ (findings)│  │ (queue/  │  │ (logs/search)│
       │           │  │  cache)  │  │              │
       └───────────┘  └──────────┘  └──────────────┘
```

---

## 2. Component Design

### 2.1 CLI Tool (`rsoc-scan`)
- Written in **Python**, distributed via `pip` and as a standalone binary (PyInstaller)
- Commands:
  ```
  rsoc-scan init                   # configure target + auth
  rsoc-scan run --spec openapi.yaml
  rsoc-scan run --url https://api.example.com --crawl
  rsoc-scan report --format pdf
  rsoc-scan ci --fail-on critical
  ```
- Reads config from `rsoc.yaml` or environment variables
- Communicates with the backend REST API or runs in **offline mode** locally

---

### 2.2 API Gateway
- **FastAPI** application serving as the single entry point
- Responsibilities:
  - JWT authentication validation
  - Organization-level multi-tenancy isolation
  - Request rate limiting (slowapi)
  - Routes: `/scans`, `/findings`, `/reports`, `/targets`, `/webhooks`

---

### 2.3 Scan Scheduler
- **Celery** with **Redis** as the broker
- Receives scan jobs from the API Gateway
- Distributes tasks to the appropriate scan engine worker pools
- Supports scheduled/recurring scans (cron-like via Celery Beat)
- Priority queues: `critical` > `standard` > `background`

---

### 2.4 Scan Engine Modules

Each module is an isolated Celery task consuming from the task queue:

#### Discovery Module
- Parse OpenAPI/Swagger YAML/JSON specs → extract endpoints, params, schemas
- Parse Postman Collection v2.1 JSON
- Parse GraphQL introspection response
- HAR file analysis for passive discovery
- Active path fuzzing with SecLists wordlists (optional)

#### Authentication Module
- Test each endpoint without auth → detect `200 OK` on protected routes (FR-06)
- JWT analysis: decode, check `alg:none`, validate expiry logic
- API key entropy check (detect weak keys)
- Replay attack detection baseline

#### Authorization (BOLA/IDOR) Module
- Generate two user sessions (User A vs User B)
- Replace User A object IDs in requests with User B's IDs
- Compare responses: match = potential BOLA
- Integer ID incrementing/decrementing pattern testing

#### Injection Module
- Fuzz each parameter with payloads from OWASP fuzzing lists
- SQLi: error-based, time-based (async with timeout comparison)
- NoSQLi: `$where`, `$gt` operator injection in JSON body
- CMDi: OS command payloads with time-delay detection
- SSRF: Internal IP/cloud metadata endpoint (169.254.169.254) payloads
- XXE: External entity payload for XML content-type endpoints

#### Rate Limit Module
- Send N requests (configurable, default 100) to auth/sensitive endpoints
- Measure response delta — detect 429 absence
- Test header bypass: `X-Forwarded-For`, `X-Real-IP` rotation

#### Data Exposure Module
- Response body regex scan for PII patterns:
  - Email: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
  - SSN: `\d{3}-\d{2}-\d{4}`
  - Credit card: Luhn algorithm check on digit sequences
  - JWT tokens, AWS keys, private keys in responses
- Compare response schema against OpenAPI spec — flag extra fields

#### Misconfiguration Module
- CORS: Send `Origin: https://evil.com` → check `Access-Control-Allow-Origin`
- TLS: Check certificate validity, TLS version, cipher suites via `ssl` module
- Security headers: Check for `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
- Error verbosity: Trigger 400/500 errors → scan response body for stack traces
- HTTP methods: OPTIONS request → flag TRACE, unexpected PUT/DELETE

---

### 2.5 Report Service
- Aggregates all findings from PostgreSQL for a given scan
- Renders PDF via **WeasyPrint** from Jinja2 HTML templates
- JSON output conforming to SARIF 2.1 format for IDE integration
- Severity coloring, CVSS score display, fix recommendations embedded

---

### 2.6 Web Dashboard (Frontend)
- **React + Vite** SPA
- Pages:
  - **Home Dashboard** — risk score, scan history, trend charts
  - **Scans** — run new scan, live log stream (WebSocket)
  - **Findings** — filterable table: severity, endpoint, vulnerability type
  - **Reports** — download PDF/JSON
  - **Settings** — API keys, webhooks, team management
- Real-time scan progress via **WebSocket** connection to backend

---

## 3. Data Models

### Scan
```
id           UUID (PK)
org_id       UUID (FK)
target_url   VARCHAR(500)
spec_type    ENUM (openapi, postman, graphql, crawl)
status       ENUM (queued, running, completed, failed)
started_at   TIMESTAMP
completed_at TIMESTAMP
config       JSONB
```

### Finding
```
id            UUID (PK)
scan_id       UUID (FK)
endpoint      VARCHAR(500)
method        VARCHAR(10)
category      VARCHAR(100)   -- e.g. "BOLA", "SQLi", "CORS"
severity      ENUM (critical, high, medium, low, info)
title         VARCHAR(200)
description   TEXT
request_raw   TEXT           -- captured HTTP request
response_raw  TEXT           -- captured HTTP response
cvss_score    DECIMAL(4,1)
remediation   TEXT
owasp_ref     VARCHAR(50)    -- e.g. "API1:2023"
created_at    TIMESTAMP
```

### Target
```
id          UUID (PK)
org_id      UUID (FK)
name        VARCHAR(100)
base_url    VARCHAR(500)
auth_type   ENUM (none, bearer, apikey, oauth2, basic)
auth_config JSONB (encrypted)
created_at  TIMESTAMP
```

---

## 4. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Async scanning | Celery + Redis | Decouples HTTP server from long-running scans |
| Database | PostgreSQL + JSONB | Relational integrity + flexible config storage |
| Findings search | Elasticsearch | Full-text search across finding descriptions |
| CLI distribution | Python + PyPI | Easy install for developers (`pip install rsoc-scan`) |
| Report format | SARIF + PDF | SARIF = IDE integration, PDF = compliance reports |
| Auth | JWT + refresh tokens | Stateless, scalable, short-lived tokens |
| Secrets encryption | AES-256-GCM | Industry standard for credentials at rest |
| Concurrency | Async HTTP (httpx) | Non-blocking concurrent requests in scan workers |

---

## 5. Security Design (Dogfooding)

The scanner itself must be secure:

- All stored credentials (API keys, bearer tokens) encrypted via **AES-256-GCM** with a key derived from org-level secret
- Scan traffic is isolated — each scan worker runs in a containerized environment
- Network egress from workers restricted to scan target only (via iptables/network policy)
- No storing of full response bodies beyond configurable retention window (default 30 days)
- RBAC: roles → `admin`, `scanner`, `viewer`, enforced at API gateway level
- Full audit log of all scan invocations stored in Elasticsearch

---

## 6. Deployment Architecture

```
                          [ CloudFlare CDN / WAF ]
                                    │
                          [ Load Balancer (NGINX) ]
                          ┌─────────┴──────────┐
                    [ API Instance 1 ]   [ API Instance 2 ]
                          └─────────┬──────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                         ▼
   [ Worker Pool 1 ]        [ Worker Pool 2 ]         [ Beat Scheduler ]
   (scan engine)            (scan engine)             (cron scans)
           │                        │
           └────────────┬───────────┘
                        ▼
        ┌───────────────────────────┐
        │   PostgreSQL (Primary)    │
        │   +  Read Replica         │
        └───────────────────────────┘
        ┌───────────────────────────┐
        │   Redis Cluster            │
        └───────────────────────────┘
        ┌───────────────────────────┐
        │   Elasticsearch Cluster   │
        └───────────────────────────┘
```

### Container Orchestration
- **Docker Compose** for local/dev
- **Kubernetes (Helm chart)** for production
- Horizontal pod autoscaling on worker deployment based on queue depth

---

## 7. API Design (Key Endpoints)

```
POST   /api/v1/scans                  # start a new scan
GET    /api/v1/scans/{id}             # get scan status & metadata
GET    /api/v1/scans/{id}/findings    # paginated findings list
GET    /api/v1/scans/{id}/report      # download report (format=json|pdf|html)
DELETE /api/v1/scans/{id}             # cancel or delete scan

POST   /api/v1/targets                # register an API target
GET    /api/v1/targets                # list targets

POST   /api/v1/webhooks               # register a webhook
WS     /api/v1/scans/{id}/stream      # real-time scan log stream
```

---

## 8. Scan Lifecycle State Machine

```
              ┌───────────┐
              │  QUEUED   │
              └─────┬─────┘
                    │ worker picks up
                    ▼
              ┌───────────┐
              │  RUNNING  │◄──── progress updates via WebSocket
              └─────┬─────┘
           ┌────────┴────────┐
           ▼                 ▼
    ┌───────────┐      ┌──────────┐
    │ COMPLETED │      │  FAILED  │
    └───────────┘      └──────────┘
           │
           ▼
    ┌──────────────┐
    │ REPORT_READY │
    └──────────────┘
```

---

## 9. Extensibility

Custom vulnerability checks can be added as Python plugins:

```python
from rsoc_scan.plugins import BaseCheck, Finding, Severity

class MyCustomCheck(BaseCheck):
    name = "custom-header-check"
    
    def run(self, endpoint, response) -> list[Finding]:
        findings = []
        if "X-Powered-By" in response.headers:
            findings.append(Finding(
                title="Technology Disclosure",
                severity=Severity.LOW,
                endpoint=endpoint.url,
                remediation="Remove X-Powered-By header"
            ))
        return findings
```

Plugins are discovered via Python entry points and loaded dynamically.

---

## 10. Performance Targets

| Scenario | Target |
|---|---|
| 100 endpoints, all checks | < 5 minutes |
| 1,000 endpoints | < 30 minutes |
| Concurrent scans per instance | 50 |
| API response time (p99) | < 300ms |
| WebSocket scan event latency | < 1 second |
