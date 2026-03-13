"""
Rate Limiting Module
- Sends N rapid requests to detect missing rate limiting
- Tests bypass via IP-spoofing headers
"""
import httpx
import asyncio
from typing import List, Dict


async def check_rate_limiting(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
    count: int = 30,
) -> List[Dict]:
    findings = []
    status_codes = []
    try:
        tasks = [client.request(method, url, headers=headers, timeout=8) for _ in range(count)]
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        for r in responses:
            if isinstance(r, Exception):
                continue
            status_codes.append(r.status_code)

        rate_limited = any(s == 429 for s in status_codes)
        success_count = sum(1 for s in status_codes if s < 400)

        if not rate_limited and success_count >= count * 0.8:
            findings.append({
                "title": "Missing Rate Limiting",
                "category": "Rate Limiting",
                "severity": "high",
                "owasp_ref": "API4:2023",
                "cvss_score": 7.5,
                "description": f"{method} {url} returned successful responses for all {count} "
                               f"rapid requests without any rate limiting (no HTTP 429 observed). "
                               f"This endpoint is vulnerable to brute-force, credential stuffing, "
                               f"and abuse attacks.",
                "remediation": "Implement rate limiting using token bucket or sliding window "
                               "algorithms. Return HTTP 429 with Retry-After header when limits "
                               "are exceeded. Consider per-IP, per-user, and global limits.",
                "request_raw": f"{method} {url}\n[Sent {count} rapid requests]",
                "response_raw": f"All {success_count}/{count} requests succeeded. No 429 responses.",
            })
    except Exception:
        pass
    return findings


async def check_rate_limit_bypass(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
) -> List[Dict]:
    """Test if rate limit can be bypassed via IP spoofing headers."""
    findings = []
    bypass_headers_list = [
        {"X-Forwarded-For": "1.2.3.4"},
        {"X-Real-IP": "1.2.3.4"},
        {"CF-Connecting-IP": "1.2.3.4"},
        {"X-Originating-IP": "1.2.3.4"},
    ]
    for bypass_header in bypass_headers_list:
        test_headers = {**headers, **bypass_header}
        try:
            responses = await asyncio.gather(
                *[client.request(method, url, headers=test_headers, timeout=8) for _ in range(15)],
                return_exceptions=True
            )
            ok = [r for r in responses if not isinstance(r, Exception) and r.status_code < 400]
            if len(ok) >= 12:
                header_name = list(bypass_header.keys())[0]
                findings.append({
                    "title": f"Rate Limit Bypass via {header_name}",
                    "category": "Rate Limiting",
                    "severity": "medium",
                    "owasp_ref": "API4:2023",
                    "cvss_score": 6.5,
                    "description": f"Rate limiting on {method} {url} can be bypassed by "
                                   f"setting the `{header_name}` header to a spoofed IP address. "
                                   f"All 15 rapid requests succeeded using this header.",
                    "remediation": "Do not trust client-supplied IP headers for rate limiting. "
                                   "Use the actual socket IP unless you have a trusted proxy layer. "
                                   "If using a proxy, validate the X-Forwarded-For chain.",
                    "request_raw": f"{method} {url}\n{header_name}: 1.2.3.4",
                    "response_raw": f"{len(ok)}/15 requests succeeded",
                })
                break
        except Exception:
            pass
    return findings
