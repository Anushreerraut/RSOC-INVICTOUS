"""
Authentication Check Module
- Detects endpoints accessible without authentication
- Tests JWT vulnerabilities (alg:none, expiry)
- Detects weak API keys
"""
import httpx
import re
import base64
import json
from typing import List, Dict, Any


JWT_NONE_PAYLOAD = "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwiYWRtaW4iOnRydWV9."


async def check_missing_auth(
    client: httpx.AsyncClient,
    endpoint: str,
    method: str,
    headers: dict,
    original_status: int,
) -> List[Dict]:
    """Check if endpoint is reachable without Authorization header."""
    findings = []
    no_auth_headers = {k: v for k, v in headers.items() if k.lower() != "authorization"}
    try:
        resp = await client.request(method, endpoint, headers=no_auth_headers, timeout=10)
        if resp.status_code in (200, 201, 202, 204) and original_status in (200, 201):
            findings.append({
                "title": "Missing Authentication on Endpoint",
                "category": "Broken Authentication",
                "severity": "high",
                "owasp_ref": "API2:2023",
                "cvss_score": 7.5,
                "description": f"The endpoint {method} {endpoint} returns a successful response "
                               f"without authentication credentials. Unauthenticated users may "
                               f"access protected data.",
                "remediation": "Enforce authentication middleware on all non-public endpoints. "
                               "Return HTTP 401 when no valid credentials are provided.",
                "request_raw": f"{method} {endpoint}\n(No Authorization header)",
                "response_raw": f"HTTP {resp.status_code}\n{resp.text[:500]}",
            })
    except Exception:
        pass
    return findings


async def check_jwt_alg_none(
    client: httpx.AsyncClient,
    endpoint: str,
    method: str,
    headers: dict,
) -> List[Dict]:
    """Test if server accepts JWT with alg:none."""
    findings = []
    test_headers = dict(headers)
    test_headers["Authorization"] = f"Bearer {JWT_NONE_PAYLOAD}"
    try:
        resp = await client.request(method, endpoint, headers=test_headers, timeout=10)
        if resp.status_code in (200, 201, 202, 204):
            findings.append({
                "title": "JWT Algorithm None Bypass",
                "category": "Broken Authentication",
                "severity": "critical",
                "owasp_ref": "API2:2023",
                "cvss_score": 9.8,
                "description": "The server accepts a JWT token with algorithm set to 'none', "
                               "meaning the signature is not verified. An attacker can forge "
                               "arbitrary tokens and authenticate as any user.",
                "remediation": "Explicitly whitelist allowed JWT algorithms (e.g., RS256, HS256). "
                               "Never accept 'none' as a valid algorithm.",
                "request_raw": f"{method} {endpoint}\nAuthorization: Bearer {JWT_NONE_PAYLOAD}",
                "response_raw": f"HTTP {resp.status_code}\n{resp.text[:500]}",
            })
    except Exception:
        pass
    return findings


def check_api_key_strength(key: str) -> List[Dict]:
    """Analyze an API key for weak entropy."""
    findings = []
    if len(key) < 16:
        findings.append({
            "title": "Weak API Key — Insufficient Length",
            "category": "Broken Authentication",
            "severity": "medium",
            "owasp_ref": "API2:2023",
            "cvss_score": 5.3,
            "description": f"The API key provided has only {len(key)} characters. "
                           "Short keys are vulnerable to brute-force attacks.",
            "remediation": "API keys should be at least 32 cryptographically random characters.",
            "request_raw": f"API Key: {key[:4]}...",
            "response_raw": "",
        })
    if re.match(r'^[a-zA-Z0-9]{1,20}$', key) and len(set(key)) < 5:
        findings.append({
            "title": "Weak API Key — Low Entropy",
            "category": "Broken Authentication",
            "severity": "medium",
            "owasp_ref": "API2:2023",
            "cvss_score": 5.3,
            "description": "The API key appears to have very low entropy (few unique characters). "
                           "This makes it easier to guess or brute-force.",
            "remediation": "Generate API keys using a cryptographically secure random number "
                           "generator (e.g., secrets.token_urlsafe(32) in Python).",
            "request_raw": f"API Key: {key[:4]}...",
            "response_raw": "",
        })
    return findings
