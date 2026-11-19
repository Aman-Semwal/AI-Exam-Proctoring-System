from fastapi import APIRouter

from app.core.frame import decode_frame
from app.models.face import FrameRequest
from app.models.object import ObjectInferenceResponse
from app.services.object_service import detect_objects, split_unauthorized

router = APIRouter(prefix="/infer", tags=["object"])


@router.post("/object", response_model=ObjectInferenceResponse)
def detect_object(req: FrameRequest):
    """Detects objects in a single frame via YOLOv8n (ONNX Runtime) and
    flags any that match the exam-integrity watchlist (phones, books,
    remotes — see object_service._WATCHLIST for the full rationale).

    Plain (sync) function for the same reason as /infer/face and
    /infer/gaze: synchronous CPU-bound inference, no await points, and
    FastAPI dispatches sync path operations to a worker thread pool
    automatically so concurrent requests don't block each other.
    """
    frame = decode_frame(req.image)
    objects = detect_objects(frame)
    unauthorized = split_unauthorized(objects)
    return ObjectInferenceResponse(
        objects=objects,
        unauthorized_objects=unauthorized,
        flagged=bool(unauthorized),
    )