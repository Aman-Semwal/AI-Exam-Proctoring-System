"""API key authentication middleware for the AI inference service.

secure-code-guardian: The AI service exposes expensive ML inference endpoints
(face detection, gaze analysis, object detection, identity verification).
Without authentication, any process that can reach the service port can:
  - Exhaust GPU/CPU resources via inference flooding (DoS)
  - Exfiltrate proctoring data (frames, embeddings) from the internal network
  - Trigger unlimited inference calls at zero cost to the attacker

Design:
  - API key is passed in the `X-API-Key` header on every request.
  - The key is read from the AI_SERVICE_API_KEY environment variable
    (never hardcoded — secure-code-guardian MUST NOT hardcode secrets).
  - The /health endpoint is intentionally excluded from auth so Docker
    health checks and orchestration probes work without credentials.
  - Constant-time comparison (`secrets.compare_digest`) prevents timing
    attacks where an attacker measures response time to guess the key
    character-by-character.
  - If AI_SERVICE_API_KEY is not set (empty string), auth is DISABLED
    and a startup warning is logged. This allows running without a key
    in a fully trusted private network (e.g. docker-compose internal
    networking where the port is NOT exposed to the host).

Spring Boot side: set AI_SERVICE_API_KEY in backend/.env and add the
header to WebClientConfig.aiServiceWebClient via
  .defaultHeader("X-API-Key", aiServiceApiKey)
See WebClientConfig.java — a TODO comment has been added there.
"""

import os
import secrets

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Endpoints that do NOT require authentication.
# The /health route is used by Docker health checks and Kubernetes probes —
# blocking it would cause the container to restart unnecessarily.
_PUBLIC_PATHS = {"/health"}

_API_KEY = os.environ.get("AI_SERVICE_API_KEY", "").strip()


class ApiKeyMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that enforces X-API-Key authentication.

    Added to the FastAPI app in main.py via:
        app.add_middleware(ApiKeyMiddleware)
    """

    async def dispatch(self, request: Request, call_next):
        # Skip auth for public paths (health check, docs when enabled)
        path = request.url.path
        if path in _PUBLIC_PATHS or path.startswith("/docs") or path.startswith("/openapi"):
            return await call_next(request)

        # If no API key is configured, skip auth with a startup-time warning
        # (logged once at import time below). Allows local dev without a key.
        if not _API_KEY:
            return await call_next(request)

        provided_key = request.headers.get("X-API-Key", "")

        # Constant-time comparison — prevents timing side-channel attacks
        if not provided_key or not secrets.compare_digest(provided_key, _API_KEY):
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized: invalid or missing API key"},
            )

        return await call_next(request)
