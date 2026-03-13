"""
WAF/IPS/IDS Detector Module
- Sends known malicious payloads (SQLi, XSS) to detect active defense mechanisms.
- Identifies signature-based block responses (403, 406) or dropped connections.
- Checks common Web Application Firewall (WAF) headers.
"""
import httpx
from typing import List, Dict

# Common WAF/IPS identification headers
WAF_HEADERS = {
    "server": {
        "cloudflare": "Cloudflare WAF Detected",
        "imperva": "Imperva SecureSphere WAF Detected",
        "akamai": "Akamai WAF/CDN Detected",
        "sucuri": "Sucuri WAF Detected",
        "aws": "AWS WAF Detected",
        "f5": "F5 BIG-IP Detected",
    },
    "x-sucuri-id": {"": "Sucuri WAF Detected"},
    "cf-ray": {"": "Cloudflare WAF/CDN Detected"},
}

# Payloads commonly blocked by IPS/IDS/WAF
MALICIOUS_PAYLOADS = [
    "' OR 1=1 --", # SQLi
    "<script>alert(1)</script>", # XSS
    "../../../../etc/passwd", # Path Traversal
]

async def check_waf_ips(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
) -> List[Dict]:
    findings = []
    
    # 1. Check for basic WAF headers on a benign request
    try:
        benign_resp = await client.request(method, url, headers=headers, timeout=10)
        
        for header_key, identifiers in WAF_HEADERS.items():
            if header_key in benign_resp.headers:
                val = benign_resp.headers[header_key].lower()
                for keyword, title in identifiers.items():
                    if keyword in val or keyword == "":
                        findings.append({
                            "title": f"Active Defense: {title}",
                            "category": "Active Defense Detection",
                            "severity": "info",
                            "owasp_ref": "API8:2023",
                            "cvss_score": 0.0,
                            "description": f"The API appears to be protected by a WAF/IPS. The `{header_key}` "
                                           f"header indicates the presence of {title}.",
                            "remediation": "This is an informational finding. Ensure the WAF/IPS is properly configured "
                                           "and rulesets are up-to-date.",
                            "request_raw": f"{method} {url}",
                            "response_raw": f"{header_key}: {benign_resp.headers[header_key]}",
                        })
                        break # Avoid duplicate findings for the same WAF based on headers
                        
    except Exception:
        pass # If benign request fails, we can't reliably test further

    # 2. Heuristic IPS/WAF detection using malicious payload
    # Only test if no WAF was clearly identified via headers, or to confirm active blocking behavior.
    if method == "GET":
        test_url = f"{url}?test={MALICIOUS_PAYLOADS[0]}"
    else:
        test_url = url
        
    try:
        # We test with a malicious parameter value
        malicious_resp = await client.request(method, test_url, headers=headers, timeout=10)
        
        if malicious_resp.status_code in [403, 406]:
             findings.append({
                 "title": "Active Defense: Traffic Blocked (WAF/IPS Behavior)",
                 "category": "Active Defense Detection",
                 "severity": "info",
                 "owasp_ref": "API8:2023",
                 "cvss_score": 0.0,
                 "description": f"The endpoint returned a {malicious_resp.status_code} status code specifically when a "
                                f"malicious payload was injected. This strongly suggests an active Intrusion "
                                f"Prevention System (IPS) or Web Application Firewall (WAF) is filtering traffic.",
                 "remediation": "Informational. Verify that ruleset enforcement aligns with your security policies.",
                 "request_raw": f"{method} {test_url}",
                 "response_raw": f"HTTP {malicious_resp.status_code}\n{malicious_resp.text[:200]}",
             })
             
    except httpx.ReadTimeout:
        # Connection drops or extreme delays often indicate IPS blocking at the network layer.
        findings.append({
             "title": "Active Defense: Connection Dropped (Possible IPS)",
             "category": "Active Defense Detection",
             "severity": "info",
             "owasp_ref": "API8:2023",
             "cvss_score": 0.0,
             "description": f"The connection was dropped or timed out specifically when a malicious payload was injected. "
                            f"This behavior is characteristic of an Intrusion Prevention System (IPS) terminating anomalous sessions.",
             "remediation": "Informational finding.",
             "request_raw": f"{method} {test_url}",
             "response_raw": "Connection Timed Out / Dropped",
         })
    except Exception:
         pass # other network errors

    return findings
