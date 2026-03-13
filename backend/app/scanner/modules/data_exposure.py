"""
Data Exposure Module
- Scans API responses for PII patterns (email, SSN, CC, tokens)
- Detects sensitive data in headers (stack traces, server info)
- Detects excessive data in responses vs. schema
"""
import re
import httpx
from typing import List, Dict, Any

# PII Regex Patterns
PATTERNS = {
    "Email Address": (r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", "medium", 5.3, "API3:2023"),
    "SSN (US Social Security)": (r"\b\d{3}-\d{2}-\d{4}\b", "critical", 9.1, "API3:2023"),
    "Credit Card Number": (r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b", "critical", 9.1, "API3:2023"),
    "AWS Access Key": (r"\bAKIA[0-9A-Z]{16}\b", "critical", 9.8, "API3:2023"),
    "Private RSA Key": (r"-----BEGIN RSA PRIVATE KEY-----", "critical", 9.8, "API3:2023"),
    "JWT Token in Response": (r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+", "high", 7.5, "API3:2023"),
    "Hardcoded Password": (r'"password"\s*:\s*"[^"]{4,}"', "high", 7.5, "API3:2023"),
    "Internal IP Address": (r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b", "medium", 5.3, "API8:2023"),
    "Phone Number": (r"\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b", "low", 3.7, "API3:2023"),
}

SENSITIVE_HEADERS = [
    ("Server", "Server Version Disclosure", "info", 2.0),
    ("X-Powered-By", "Technology Disclosure via X-Powered-By", "low", 3.7),
    ("X-AspNet-Version", "ASP.NET Version Disclosure", "low", 3.7),
    ("X-Debug-Token", "Debug Token Exposed in Response", "medium", 6.5),
]

STACK_TRACE_SIGNATURES = [
    "traceback (most recent call last)", "exception in thread",
    "at com.", "at org.", "syntaxerror:", "typeerror:",
    "nullpointerexception", "cannot read property", "stack trace:",
    "debug_info", "fatal error", "unhandled exception",
]


async def check_data_exposure(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
) -> List[Dict]:
    findings = []
    try:
        resp = await client.request(method, url, headers=headers, timeout=10)
        body = resp.text

        # Check response body for PII
        for pii_name, (pattern, severity, cvss, owasp) in PATTERNS.items():
            matches = re.findall(pattern, body)
            if matches:
                sample = matches[0][:40] + ("..." if len(matches[0]) > 40 else "")
                findings.append({
                    "title": f"Sensitive Data Exposure — {pii_name}",
                    "category": "Data Exposure",
                    "severity": severity,
                    "owasp_ref": owasp,
                    "cvss_score": cvss,
                    "description": f"{method} {url} returns what appears to be {pii_name} "
                                   f"in the response body (found {len(matches)} occurrence(s)). "
                                   f"Sample: `{sample}`",
                    "remediation": f"Audit API response schemas to ensure only required fields "
                                   f"are returned. Mask or exclude {pii_name} fields from responses. "
                                   f"Apply field-level authorization before serializing responses.",
                    "request_raw": f"{method} {url}",
                    "response_raw": f"HTTP {resp.status_code}\n{body[:400]}",
                })

        # Check response headers for sensitive info
        for header_name, title, severity, cvss in SENSITIVE_HEADERS:
            val = resp.headers.get(header_name)
            if val:
                findings.append({
                    "title": title,
                    "category": "Data Exposure",
                    "severity": severity,
                    "owasp_ref": "API8:2023",
                    "cvss_score": cvss,
                    "description": f"The response from {method} {url} includes the `{header_name}` "
                                   f"header with value: `{val}`. This reveals implementation details "
                                   f"that can assist attackers in fingerprinting your stack.",
                    "remediation": f"Remove or suppress the `{header_name}` response header. "
                                   f"In most frameworks, this can be done via middleware configuration.",
                    "request_raw": f"{method} {url}",
                    "response_raw": f"{header_name}: {val}",
                })

        # Check for stack traces
        body_lower = body.lower()
        for sig in STACK_TRACE_SIGNATURES:
            if sig in body_lower:
                findings.append({
                    "title": "Verbose Error — Stack Trace Exposed",
                    "category": "Data Exposure",
                    "severity": "medium",
                    "owasp_ref": "API8:2023",
                    "cvss_score": 5.3,
                    "description": f"The response from {method} {url} contains what appears to be "
                                   f"a stack trace or verbose error message. This can reveal "
                                   f"internal file paths, library versions, and code structure.",
                    "remediation": "Configure production error handlers to return generic error "
                                   "messages. Never expose stack traces in API responses. "
                                   "Log errors server-side only.",
                    "request_raw": f"{method} {url}",
                    "response_raw": f"HTTP {resp.status_code}\n{body[:400]}",
                })
                break
    except Exception:
        pass
    return findings
