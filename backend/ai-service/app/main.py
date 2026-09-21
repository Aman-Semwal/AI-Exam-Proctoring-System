import logging
import os

from fastapi import FastAPI

from app.middleware.auth import ApiKeyMiddleware
from app.routers import analysis, audio, face, gaze, health, identity, objects

logger = logging.getLogger(__name__)

app = FastAPI(title="AI Exam Proctoring — AI Inference Service")

# secure-code-guardian: Enforce API key authentication on all inference endpoints.
# Set AI_SERVICE_API_KEY in the environment (backend/.env) to enable.
# If not set, auth is skipped — acceptable only on an isolated private network
# where the service port is NOT exposed externally.
app.add_middleware(ApiKeyMiddleware)

if not os.environ.get("AI_SERVICE_API_KEY", "").strip():
    logger.warning(
        "AI_SERVICE_API_KEY is not set — API key authentication is DISABLED. "
        "Set this variable in production to prevent unauthorized inference access."
    )

app.include_router(health.router)
app.include_router(face.router)
app.include_router(gaze.router)
app.include_router(objects.router)
app.include_router(identity.router)
app.include_router(audio.router)
app.include_router(analysis.router)