"""
Main Scan Engine Orchestrator
- Runs all scan modules against discovered endpoints
- Persists findings to the database
- Updates scan status throughout
"""
import asyncio
import httpx
from datetime import datetime
from typing import List, Dict, Any

from app.core.database import SessionLocal
from app.models.scan import Scan, ScanStatus
from app.models.finding import Finding, Severity
from app.scanner.modules import discovery, auth_check, injection, rate_limit, data_exposure, misconfiguration, waf_detector, mass_assignment


SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}


def _save_findings(db, scan_id: str, raw_findings: List[Dict], endpoint: str, method: str):
    for f in raw_findings:
        finding = Finding(
            scan_id=scan_id,
            endpoint=endpoint,
            method=method,
            category=f.get("category", "General"),
            severity=f.get("severity", "info"),
            title=f.get("title", "Unknown"),
            description=f.get("description", ""),
            request_raw=f.get("request_raw", ""),
            response_raw=f.get("response_raw", ""),
            cvss_score=f.get("cvss_score"),
            remediation=f.get("remediation", ""),
            owasp_ref=f.get("owasp_ref", ""),
        )
        db.add(finding)
    db.commit()


def _build_headers(scan: Scan) -> dict:
    """Build request headers from scan target auth config."""
    headers = {
        "User-Agent": "RSOC-Scanner/1.0",
        "Accept": "application/json",
    }
    if scan.target and scan.target.auth_type == "bearer":
        token = scan.target.auth_config.get("token", "")
        if token:
            headers["Authorization"] = f"Bearer {token}"
    elif scan.target and scan.target.auth_type == "apikey":
        key_name = scan.target.auth_config.get("header", "X-API-Key")
        key_val = scan.target.auth_config.get("token", "")
        if key_val:
            headers[key_name] = key_val
    return headers


async def _scan_endpoint(
    client: httpx.AsyncClient,
    scan: Scan,
    db,
    endpoint_info: Dict,
    headers: dict,
):
    url = endpoint_info.get("full_path") or endpoint_info.get("path", "")
    method = endpoint_info.get("method", "GET")
    params = endpoint_info.get("parameters", [])

    all_findings = []

    # 1. Make initial request to get baseline
    try:
        baseline_resp = await client.request(method, url, headers=headers, timeout=15)
        original_status = baseline_resp.status_code
    except Exception:
        original_status = 0

    # 2. Data Exposure
    found = await data_exposure.check_data_exposure(client, url, method, headers)
    all_findings.extend(found)

    # 2b. WAF / IPS / IDS Detection
    found = await waf_detector.check_waf_ips(client, url, method, headers)
    all_findings.extend(found)

    # 3. Security Misconfiguration (headers + CORS + HTTP methods)
    found = await misconfiguration.check_security_headers(client, url, method, headers)
    all_findings.extend(found)

    found = await misconfiguration.check_cors(client, url, headers)
    all_findings.extend(found)

    found = await misconfiguration.check_http_methods(client, url, headers)
    all_findings.extend(found)

    # 4. Auth checks (only on endpoints that returned 200 with auth)
    if original_status in (200, 201, 202):
        found = await auth_check.check_missing_auth(client, url, method, headers, original_status)
        all_findings.extend(found)

        found = await auth_check.check_jwt_alg_none(client, url, method, headers)
        all_findings.extend(found)

    # 5. Injection (only if there are parameters)
    if params:
        found = await injection.test_sqli(client, url, method, params, headers)
        all_findings.extend(found)

        found = await injection.test_ssrf(client, url, method, params, headers)
        all_findings.extend(found)

        found = await injection.test_path_traversal(client, url, method, params, headers)
        all_findings.extend(found)

    # 5b. Mass Assignment (only if POST/PUT/PATCH)
    found = await mass_assignment.check_mass_assignment(client, url, method, headers)
    all_findings.extend(found)

    # 6. Rate Limiting (only on auth/sensitive-looking endpoints)
    sensitive_keywords = ["login", "auth", "token", "password", "register", "reset", "verify"]
    if any(kw in url.lower() for kw in sensitive_keywords):
        found = await rate_limit.check_rate_limiting(client, url, method, headers, count=20)
        all_findings.extend(found)

        found = await rate_limit.check_rate_limit_bypass(client, url, method, headers)
        all_findings.extend(found)

    _save_findings(db, scan.id, all_findings, url, method)
    return len(all_findings)


async def _run_scan(scan_id: str):
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        scan.status = ScanStatus.running
        scan.started_at = datetime.utcnow()
        db.commit()

        # Build headers
        headers = _build_headers(scan)

        # Discover endpoints
        endpoints = []
        if scan.spec_content:
            endpoints = discovery.parse_openapi(scan.spec_content)
        
        # If no spec or empty spec, use common paths against the target URL
        if not endpoints:
            base_url = scan.target_url.rstrip("/")
            common = discovery.get_common_paths()
            endpoints = [
                {"full_path": base_url + path, "path": path, "method": "GET", "parameters": []}
                for path in common
            ]

        # Run scans with concurrency limit
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=15) as client:
            sem = asyncio.Semaphore(5)
            async def scan_with_sem(ep):
                async with sem:
                    return await _scan_endpoint(client, scan, db, ep, headers)

            results = await asyncio.gather(*[scan_with_sem(ep) for ep in endpoints], return_exceptions=True)

        # Build summary
        from app.models.finding import Finding as FindingModel
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        all_finds = db.query(FindingModel).filter(FindingModel.scan_id == scan_id).all()
        for f in all_finds:
            counts[f.severity] = counts.get(f.severity, 0) + 1

        scan.summary = {**counts, "total": len(all_finds)}
        scan.status = ScanStatus.completed
        scan.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        if scan:
            scan.status = ScanStatus.failed
            scan.error_message = str(e)
            db.commit()
    finally:
        db.close()


def run_scan_background(scan_id: str):
    """Entry point called by FastAPI BackgroundTasks (sync wrapper)."""
    asyncio.run(_run_scan(scan_id))
