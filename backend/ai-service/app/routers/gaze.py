from fastapi import APIRouter

from app.core.frame import decode_frame
from app.models.face import FrameRequest
from app.models.gaze import GazeInferenceResponse
from app.services.gaze_service import estimate_gaze

router = APIRouter(prefix="/infer", tags=["gaze"])


@router.post("/gaze", response_model=GazeInferenceResponse)
def detect_gaze(req: FrameRequest):
    """Estimates head pose + gaze direction for a single frame and flags
    sustained deviation from looking at the screen.

    Plain (sync) function for the same reason as /infer/face: the work is
    synchronous CPU-bound OpenCV/MediaPipe inference with no await points,
    and FastAPI dispatches sync path operations to its worker thread pool
    automatically, keeping concurrent exam sessions from blocking each other.
    """
    frame = decode_frame(req.image)
    return estimate_gaze(frame)