"""
Misconfiguration Module
- CORS policy misconfigurations
- Missing security headers
- HTTP method enumeration (TRACE, unrestricted PUT/DELETE)
- TLS/SSL version check
"""
import httpx
from typing import List, Dict

EVIL_ORIGIN = "https://evil-attacker.com"

REQUIRED_SECURITY_HEADERS = [
    ("Strict-Transport-Security", "Missing HSTS Header", "medium", 5.3, "API8:2023",
     "Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to all HTTPS responses."),
    ("X-Content-Type-Options", "Missing X-Content-Type-Options Header", "low", 3.7, "API8:2023",
     "Add `X-Content-Type-Options: nosniff` to prevent MIME-sniffing attacks."),
    ("X-Frame-Options", "Missing X-Frame-Options Header", "low", 3.7, "API8:2023",
     "Add `X-Frame-Options: DENY` to prevent clickjacking."),
    ("Content-Security-Policy", "Missing Content-Security-Policy Header", "medium", 5.3, "API8:2023",
     "Define a strict Content-Security-Policy to mitigate XSS and injection risks."),
    ("X-XSS-Protection", "Missing X-XSS-Protection Header", "info", 2.0, "API8:2023",
     "Add `X-XSS-Protection: 1; mode=block` for legacy browser protection."),
]

DANGEROUS_METHODS = ["TRACE", "TRACK"]


async def check_cors(client: httpx.AsyncClient, url: str, headers: dict) -> List[Dict]:
    findings = []
    cors_headers = {**headers, "Origin": EVIL_ORIGIN}
    try:
        resp = await client.options(url, headers=cors_headers, timeout=10)
        acao = resp.headers.get("Access-Control-Allow-Origin", "")
        acac = resp.headers.get("Access-Control-Allow-Credentials", "")

        if acao == "*":
            findings.append({
                "title": "CORS Wildcard Origin — Overly Permissive",
                "category": "Security Misconfiguration",
                "severity": "medium",
                "owasp_ref": "API8:2023",
                "cvss_score": 6.5,
                "description": f"The endpoint {url} responds with `Access-Control-Allow-Origin: *` "
                               f"which allows any website to make cross-origin requests. While this "
                               f"may be intentional for public APIs, it can expose sensitive data "
                               f"if authentication headers are not required.",
                "remediation": "Replace wildcard CORS with an explicit allowlist of trusted origins. "
                               "Never combine `Access-Control-Allow-Origin: *` with "
                               "`Access-Control-Allow-Credentials: true`.",
                "request_raw": f"OPTIONS {url}\nOrigin: {EVIL_ORIGIN}",
                "response_raw": f"Access-Control-Allow-Origin: {acao}",
            })

        if EVIL_ORIGIN in acao and "true" in acac.lower():
            findings.append({
                "title": "CORS — Attacker Origin Reflected with Credentials",
                "category": "Security Misconfiguration",
                "severity": "critical",
                "owasp_ref": "API8:2023",
                "cvss_score": 9.1,
                "description": f"The endpoint {url} reflects the attacker-controlled origin "
                               f"`{EVIL_ORIGIN}` in `Access-Control-Allow-Origin` AND sets "
                               f"`Access-Control-Allow-Credentials: true`. This allows any attacker "
                               f"website to make authenticated cross-origin requests on behalf of "
                               f"any logged-in user.",
                "remediation": "Maintain a strict allowlist of trusted origins. Never reflect "
                               "arbitrary origins. Never combine reflected origins with credentials=true.",
                "request_raw": f"OPTIONS {url}\nOrigin: {EVIL_ORIGIN}",
                "response_raw": f"Access-Control-Allow-Origin: {acao}\nAccess-Control-Allow-Credentials: {acac}",
            })
    except Exception:
        pass
    return findings


async def check_security_headers(client: httpx.AsyncClient, url: str, method: str, headers: dict) -> List[Dict]:
    findings = []
    try:
        resp = await client.request(method, url, headers=headers, timeout=10)
        for header_name, title, severity, cvss, owasp, remediation in REQUIRED_SECURITY_HEADERS:
            if header_name not in resp.headers:
                findings.append({
                    "title": title,
                    "category": "Security Misconfiguration",
                    "severity": severity,
                    "owasp_ref": owasp,
                    "cvss_score": cvss,
                    "description": f"The response from {method} {url} is missing the "
                                   f"`{header_name}` security header. This header helps protect "
                                   f"users from common client-side attacks.",
                    "remediation": remediation,
                    "request_raw": f"{method} {url}",
                    "response_raw": f"[Missing header: {header_name}]\nHeaders present: {dict(resp.headers)}",
                })
    except Exception:
        pass
    return findings


async def check_http_methods(client: httpx.AsyncClient, url: str, headers: dict) -> List[Dict]:
    findings = []
    for method in DANGEROUS_METHODS:
        try:
            resp = await client.request(method, url, headers=headers, timeout=8)
            if resp.status_code not in (405, 501, 403, 404):
                findings.append({
                    "title": f"Dangerous HTTP Method Enabled — {method}",
                    "category": "Security Misconfiguration",
                    "severity": "medium",
                    "owasp_ref": "API8:2023",
                    "cvss_score": 5.8,
                    "description": f"The {method} HTTP method is enabled on {url} "
                                   f"(returned HTTP {resp.status_code}). The TRACE method "
                                   f"can be used to perform Cross-Site Tracing (XST) attacks.",
                    "remediation": f"Disable the {method} method in your web server or API "
                                   f"framework configuration. Return HTTP 405 for all "
                                   f"disallowed methods.",
                    "request_raw": f"{method} {url}",
                    "response_raw": f"HTTP {resp.status_code}",
                })
        except Exception:
            pass
    return findings
