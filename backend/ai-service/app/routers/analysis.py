from fastapi import APIRouter

from app.models.analysis import AnalyzeRequest, AnalyzeResponse
from app.services.analysis_service import analyze

router = APIRouter(prefix="/infer", tags=["analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_frame(req: AnalyzeRequest):
    """Runs face, gaze, and object detection on a single frame — plus
    identity verification if `reference_embedding` is supplied, and
    voice-activity detection if `audio` is supplied — and returns one
    combined violation list + severity score.

    This exists so the backend can make one call per proctoring "tick"
    instead of separately calling /infer/face, /infer/gaze,
    /infer/object, and optionally /infer/identity/verify and
    /infer/audio/voice-activity, then stitching the results together
    itself. The image is also only decoded once here rather than once per
    endpoint, which matters at the frame rates a live exam session runs
    at.

    The individual /infer/* endpoints are left in place and unchanged —
    this is an additive convenience endpoint, not a replacement. Useful
    if the backend ever wants a signal on its own (e.g. object detection
    at a slower cadence than gaze) without paying for every other check
    too.

    Plain (sync) function for the same reason as every other /infer/*
    endpoint: synchronous CPU-bound inference with no await points, and
    FastAPI dispatches sync path operations to a worker thread pool
    automatically so concurrent requests don't block each other.
    """
    return analyze(req)