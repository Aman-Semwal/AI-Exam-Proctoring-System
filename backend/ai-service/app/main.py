from fastapi import FastAPI

from app.routers import analysis, audio, face, gaze, health, identity, objects

app = FastAPI(title="AI Exam Proctoring — AI Inference Service")

app.include_router(health.router)
app.include_router(face.router)
app.include_router(gaze.router)
app.include_router(objects.router)
app.include_router(identity.router)
app.include_router(audio.router)
app.include_router(analysis.router)