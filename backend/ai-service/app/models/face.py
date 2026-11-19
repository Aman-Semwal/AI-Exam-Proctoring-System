from pydantic import BaseModel


class FrameRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG


class FaceBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float


class FaceInferenceResponse(BaseModel):
    # Field names/shape are a fixed contract with the Spring backend's
    # FaceInferenceResult DTO (proctoring/dto/FaceInferenceResult.java).
    # Do not rename without updating that DTO too.
    face_count: int
    faces: list[FaceBox]