"""
Discovery Module — parses OpenAPI specs or probes URLs to discover endpoints.
"""
import json
import yaml
from typing import List, Dict, Any


def parse_openapi(spec_content: str) -> List[Dict[str, Any]]:
    """Parse OpenAPI YAML or JSON and return a list of endpoint dicts."""
    endpoints = []
    try:
        if spec_content.strip().startswith("{"):
            spec = json.loads(spec_content)
        else:
            spec = yaml.safe_load(spec_content)

        base_path = spec.get("basePath", "") or ""
        servers = spec.get("servers", [])
        server_url = servers[0].get("url", "") if servers else base_path

        paths = spec.get("paths", {})
        for path, methods in paths.items():
            for method, details in methods.items():
                if method.upper() not in ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"):
                    continue
                params = details.get("parameters", [])
                request_body = details.get("requestBody", {})
                endpoints.append({
                    "path": path,
                    "method": method.upper(),
                    "full_path": server_url.rstrip("/") + path,
                    "parameters": params,
                    "request_body": request_body,
                    "summary": details.get("summary", ""),
                    "operation_id": details.get("operationId", ""),
                })
    except Exception as e:
        pass  # Return empty list on parse failure
    return endpoints


def get_common_paths() -> List[str]:
    """Return a list of common API endpoint paths for fuzzing."""
    return [
        "/api", "/api/v1", "/api/v2", "/v1", "/v2",
        "/health", "/status", "/ping",
        "/users", "/user", "/admin", "/admin/users",
        "/auth", "/login", "/logout", "/register", "/token",
        "/profile", "/me", "/account",
        "/products", "/items", "/orders",
        "/config", "/settings", "/debug",
        "/upload", "/files", "/download",
        "/search", "/query",
        "/graphql", "/swagger", "/openapi.json", "/docs",
        "/api/users/1", "/api/users/2", "/api/admin",
    ]
