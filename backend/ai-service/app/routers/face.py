from fastapi import APIRouter

from app.core.frame import decode_frame
from app.models.face import FrameRequest, FaceInferenceResponse
from app.services.face_service import detect_faces

router = APIRouter(prefix="/infer", tags=["face"])


@router.post("/face", response_model=FaceInferenceResponse)
def detect_face(req: FrameRequest):
    """Detects faces in a single frame.

    Response contract matches the Spring backend's FaceInferenceResult DTO
    (com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult):
    face_count (int) and faces (list of pixel-space boxes + confidence).

    Defined as a plain (sync) function rather than `async def` on purpose:
    the actual work (OpenCV decode + MediaPipe inference) is synchronous,
    CPU-bound code with no `await` points. FastAPI runs sync path
    operations in a worker thread pool automatically, so concurrent
    requests don't block each other on the single event-loop thread the
    way they would if this were `async def` calling blocking code directly.
    """
    frame = decode_frame(req.image)
    faces = detect_faces(frame)
    return FaceInferenceResponse(face_count=len(faces), faces=faces)