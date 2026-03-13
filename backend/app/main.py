from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import create_tables
from app.api.routes import auth, targets, scans, findings

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated API Security Scanner — detects OWASP API Top 10 vulnerabilities",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(targets.router, prefix="/api")
app.include_router(scans.router, prefix="/api")
app.include_router(findings.router, prefix="/api")


@app.on_event("startup")
def startup():
    create_tables()


@app.get("/api/health")
def health():
    return {"status": "ok", "version": settings.APP_VERSION}


@app.get("/api/stats")
def stats():
    from app.core.database import SessionLocal
    from app.models.scan import Scan, ScanStatus
    from app.models.finding import Finding
    db = SessionLocal()
    try:
        total_scans = db.query(Scan).count()
        completed_scans = db.query(Scan).filter(Scan.status == ScanStatus.completed).count()
        total_findings = db.query(Finding).count()
        critical = db.query(Finding).filter(Finding.severity == "critical").count()
        high = db.query(Finding).filter(Finding.severity == "high").count()
        return {
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "total_findings": total_findings,
            "critical": critical,
            "high": high,
        }
    finally:
        db.close()
