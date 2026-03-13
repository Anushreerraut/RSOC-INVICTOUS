# Tech Stack
# Automated API Security Scanner

**Version:** 1.0 | **Date:** 2026-03-13

---

## Stack at a Glance

| Layer | Technology | Purpose |
|---|---|---|
| **Backend API** | Python · FastAPI | REST API, auth, routing |
| **Scan Engine** | Python · httpx · Celery | Async scanning workers |
| **Task Queue** | Redis | Worker job queue & caching |
| **Primary DB** | PostgreSQL | Findings, scans, targets |
| **Search/Logs** | Elasticsearch | Full-text search, audit logs |
| **Frontend** | React · Vite · TypeScript | Web dashboard |
| **Charts** | Recharts | Trend / severity graphs |
| **CLI** | Python · Click · Rich | Developer terminal tool |
| **Reports** | Jinja2 · WeasyPrint | PDF / HTML generation |
| **Container** | Docker · Kubernetes | Deployment & orchestration |
| **CI/CD** | GitHub Actions | Pipeline integration |
| **Monitoring** | Prometheus · Grafana | System observability |

---

## 1. Backend API — FastAPI (Python)

**Why FastAPI?**
- Automatic OpenAPI docs generation (dogfoods the product concept)
- Native `async/await` support — handles many concurrent connections
- Built-in Pydantic data validation and serialization
- Fastest Python web framework in benchmarks (comparable to NodeJS)
- First-class WebSocket support for real-time scan streaming

**Key libraries:**
```
fastapi          # framework
uvicorn          # ASGI server
pydantic v2      # data models & validation
python-jose      # JWT auth
passlib + bcrypt # password hashing
slowapi          # rate limiting middleware
python-multipart # file upload (spec files)
```

---

## 2. Scan Engine — Celery + httpx

### httpx (HTTP Client)
- **Async-first** design — fire hundreds of requests concurrently
- HTTP/1.1 and HTTP/2 support
- Cookie jar, redirect handling, custom transport
- Drop-in requests-compatible API for familiar syntax

### Celery (Task Queue)
- Distributes scan tasks across multiple workers
- Priority queues: `critical`, `standard`, `background`
- Celery Beat for scheduled/recurring scans
- Retry exponential backoff on transient failures
- Canvas workflows to pipeline scan modules (chain, chord, group)

**Key scan libraries:**
```
httpx            # async HTTP client
celery           # distributed task queue
playwright       # headless browser for JS-rendered APIs (advanced)
pyjwt            # JWT decode & vulnerability checks
cryptography     # AES-256-GCM credential encryption
python-nmap      # port/service discovery (optional)
sslyze           # TLS/SSL analysis
```

---

## 3. Databases

### PostgreSQL 16
- **Primary data store** for all structured data: scans, findings, targets, users, orgs
- **JSONB columns** for flexible scan config and auth config storage
- **UUID primary keys** for distributed-safe IDs
- Read replica for dashboard queries (heavy reads)
- Connection pooling via **PgBouncer**

### Redis 7
- Celery message broker (task queue)
- Scan result caching (TTL-based)
- Rate limiting counters
- WebSocket pub/sub for real-time scan progress events
- Session tokens (short TTL)

### Elasticsearch 8
- Full-text search across vulnerability descriptions and responses
- Centralized audit logging
- Log aggregation from all services
- Dashboard aggregation queries (scan counts by severity, over time)

---

## 4. Frontend — React + Vite + TypeScript

**Why this combo?**
- **React** — component ecosystem, stable, large talent pool
- **Vite** — instant HMR, lightning-fast build compared to CRA/Webpack
- **TypeScript** — type safety matches the backend's Pydantic strictness

**Key libraries:**
```
react + react-dom       # UI framework
react-router-dom v6     # client-side routing
react-query (TanStack)  # server state, caching, background refetch
zustand                 # lightweight global state (no Redux boilerplate)
recharts                # charts (severity trends, scan history)
react-hook-form + zod   # forms with validation
axios                   # HTTP client with interceptors
xterm.js                # terminal-style live scan log stream
shadcn/ui               # headless component library (Radix UI based)
tailwindcss             # utility-first styling
```

---

## 5. CLI — Click + Rich

**Click:** Declarative CLI framework for Python — subcommands, options, flags  
**Rich:** Beautiful terminal output — progress bars, tables, colored severity output

```bash
$ rsoc-scan run --spec ./api.yaml --checks all
 Scanning https://api.example.com (87 endpoints)...
 ████████████████░░░░ 80%  [42/87 endpoints]

  CRITICAL  BOLA detected on GET /api/users/{id}
  HIGH      JWT alg:none bypass – POST /auth/token
  MEDIUM    Missing rate limiting – POST /auth/login
  LOW       Verbose error on GET /internal/debug
```

---

## 6. Reporting

| Format | Library | Use Case |
|---|---|---|
| **PDF** | WeasyPrint + Jinja2 | Compliance reports, pentest deliverables |
| **HTML** | Jinja2 | Self-contained shareable report |
| **JSON (SARIF 2.1)** | Custom serializer | IDE integration, GitHub Code Scanning |
| **CSV** | Python csv | Spreadsheet export for PM/management |

---

## 7. Infrastructure & DevOps

### Containerization
- **Docker** — each service has its own `Dockerfile`
- **Docker Compose** — local development with all dependencies in one command
- **Kubernetes (K8s)** — production orchestration with Helm chart

### Cloud Provider (Recommended)
- **AWS** (primary):
  - EKS (Kubernetes)
  - RDS PostgreSQL (managed)
  - ElastiCache Redis
  - OpenSearch (managed Elasticsearch)
  - S3 — store scan reports and spec file uploads
  - CloudFront — CDN for React SPA
  - Secrets Manager — store encryption keys, DB credentials

### CI/CD
- **GitHub Actions** — build, test, lint, Docker push, deploy
- **GitHub Container Registry (GHCR)** — Docker image storage
- Pipeline has: lint → unit tests → integration tests → security scan (dogfooding!) → deploy

### Monitoring & Observability
```
Prometheus        # metrics (scan duration, error rates, queue depth)
Grafana           # dashboards for system health
OpenTelemetry     # distributed tracing across services
Sentry            # error tracking (backend + frontend)
structlog         # structured JSON logging
```

---

## 8. Security of the Platform Itself

| Concern | Solution |
|---|---|
| Auth | OAuth2 + JWT (15 min access, 7 day refresh) |
| Secrets at rest | AES-256-GCM, key from AWS KMS |
| Secrets in transit | TLS 1.3 enforced everywhere |
| Worker isolation | Each scan worker in isolated container |
| RBAC | `admin` / `scanner` / `viewer` roles |
| API rate limiting | `slowapi` per-user token bucket |
| Supply chain | `pip-audit` in CI, Docker image vulnerability scan (Trivy) |
| Dependencies | `dependabot` for automated security updates |

---

## 9. Development Stack

| Tool | Purpose |
|---|---|
| `ruff` | Python linter + formatter (replaces flake8 + black) |
| `mypy` | Static type checking |
| `pytest + httpx` | Unit + integration tests |
| `pytest-asyncio` | Async test support |
| `factory_boy` | Test data factories |
| `pre-commit` | Git hooks: lint, format, secret scanning |
| `detect-secrets` | Pre-commit secret scan |
| `ESLint + Prettier` | Frontend lint + format |
| `Vitest` | Frontend unit tests |
| `Playwright` | E2E browser tests |

---

## 10. Why Not Alternatives?

| Alternative | Why Not Chosen |
|---|---|
| **Django** | Too heavy; FastAPI's async perf better for API server |
| **Go** | Smaller ecosystem for security payload libraries |
| **Node.js (Express)** | Python dominates the security/scanning tooling ecosystem |
| **MongoDB** | Less reliable for relational data (findings ↔ scans ↔ targets) |
| **Next.js** | SSR not needed; Vite SPA is simpler + faster for a dashboard |
| **Angular** | Heavier; React ecosystem is larger |
| **RabbitMQ** | Redis + Celery covers our needs with less operational overhead |

---

## 11. Language Version Targets

| Language | Version |
|---|---|
| Python | 3.12+ |
| TypeScript | 5.x |
| Node.js | 22 LTS |
| PostgreSQL | 16 |
| Redis | 7.2 |
| Elasticsearch | 8.x |
