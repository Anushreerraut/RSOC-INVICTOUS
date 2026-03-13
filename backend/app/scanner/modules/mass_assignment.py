"""
Mass Assignment Module
- Injects privileged fields (e.g., is_admin) into JSON POST/PUT/PATCH requests.
- Detects if the server blindly accepts and reflects these properties, indicating a Mass Assignment vulnerability.
"""
import httpx
import json
from typing import List, Dict

PRIVILEGED_PAYLOADS = [
    {"is_admin": True},
    {"isAdmin": True},
    {"role": "admin"},
    {"privilege": "elevated"},
    {"user_role": 1}
]

async def check_mass_assignment(
    client: httpx.AsyncClient,
    url: str,
    method: str,
    headers: dict,
    original_status: int = 0
) -> List[Dict]:
    findings = []
    
    # Mass assignment typically happens on data mutation endpoints
    if method not in ["POST", "PUT", "PATCH"]:
        return findings
        
    for payload in PRIVILEGED_PAYLOADS:
        try:
            # We inject our specific malicious JSON. 
            # Note: In a real-world scenario, we'd also want to merge this with valid required parameters
            test_headers = headers.copy()
            test_headers["Content-Type"] = "application/json"
            
            resp = await client.request(
                method=method, 
                url=url, 
                headers=test_headers, 
                json=payload,
                timeout=10
            )
            
            # If the server accepts it (200, 201) and reflects the injected key/value in the response
            if resp.status_code in [200, 201]:
                resp_json = resp.json()
                injected_key = list(payload.keys())[0]
                injected_val = list(payload.values())[0]
                
                # Check if the injected key exists and holds the injected value in the response
                if isinstance(resp_json, dict) and resp_json.get(injected_key) == injected_val:
                    findings.append({
                        "title": f"Mass Assignment via '{injected_key}' Field",
                        "category": "Mass Assignment",
                        "severity": "high",
                        "owasp_ref": "API6:2023", # Note: OWASP API Top 10 merged Mass Assignment into Broken Object Property Level Authorization in 2023, but the concept is the same.
                        "cvss_score": 7.5,
                         "description": f"The endpoint gracefully processed a {method} request containing the unexpected "
                                       f"privileged field `{injected_key}: {injected_val}`. Furthermore, the response "
                                       f"reflected this altered state, strongly suggesting that the server binds incoming "
                                       f"client parameters directly to internal models without whitelisting.",
                        "remediation": "Do not implicitly bind incoming client data to internal data objects or database models. "
                                       "Use Data Transfer Objects (DTOs) and strict schema validation (allow-listing) to filter "
                                       "out extraneous properties before processing.",
                        "request_raw": f"{method} {url}\n\n{json.dumps(payload, indent=2)}",
                        "response_raw": f"HTTP {resp.status_code}\n\n{json.dumps(resp_json, indent=2)}",
                    })
                    break # Stop testing this endpoint to avoid duplicate spam

        except json.JSONDecodeError:
            pass # Endpoint didn't return JSON, hard to verify mass assignment
        except Exception:
            pass # Network errors
            
    return findings
