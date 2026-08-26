from enum import Enum

from pydantic import BaseModel, field_validator

from app.models.face import FaceInferenceResponse
from app.models.gaze import GazeInferenceResponse
from app.models.identity import EMBEDDING_DIM, VerifyResponse
from app.models.object import ObjectInferenceResponse
from app.models.audio import VoiceActivityResponse


class AnalyzeRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG — required, every check needs a frame

    # Optional: only run identity verification if a reference embedding is
    # supplied (from a prior /infer/identity/embed call at enrollment).
    reference_embedding: list[float] | None = None

    # Optional: only run voice-activity analysis if an audio chunk is
    # supplied — base64 16-bit PCM WAV, mono, 16000 Hz (see
    # app/core/audio.py for why that format specifically).
    audio: str | None = None

    @field_validator("reference_embedding")
    @classmethod
    def _validate_embedding_length(cls, value: list[float] | None) -> list[float] | None:
        if value is not None and len(value) != EMBEDDING_DIM:
            raise ValueError(f"reference_embedding must have exactly {EMBEDDING_DIM} values, got {len(value)}")
        return value


class Violation(str, Enum):
    NO_FACE = "no_face"
    MULTIPLE_FACES = "multiple_faces"
    LOOKING_AWAY = "looking_away"
    UNAUTHORIZED_OBJECT = "unauthorized_object"
    IDENTITY_MISMATCH = "identity_mismatch"


class Severity(str, Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AnalyzeResponse(BaseModel):
    # Raw output from each individual detector — nothing here is
    # recomputed or reinterpreted, just collected. Kept alongside the
    # summary below so a caller that wants the granular detail (e.g. to
    # show exact gaze angles in a review UI) doesn't need a second call.
    face: FaceInferenceResponse
    gaze: GazeInferenceResponse
    objects: ObjectInferenceResponse
    identity: VerifyResponse | None = None  # None if no reference_embedding was supplied
    voice_activity: VoiceActivityResponse | None = None  # None if no audio was supplied

    violations: list[Violation]
    severity_score: int
    severity_level: Severity