from enum import Enum

from pydantic import BaseModel, Field, field_validator

from app.models.face import FaceInferenceResponse
from app.models.gaze import GazeInferenceResponse
from app.models.identity import EMBEDDING_DIM, VerifyResponse
from app.models.object import ObjectInferenceResponse
from app.models.audio import VoiceActivityResponse

# secure-code-guardian: input size limits to prevent DoS via oversized payloads.
# A 4K JPEG webcam frame base64-encodes to roughly 300-500 KB.
# A 1920x1080 full-quality JPEG encodes to roughly 1.5 MB base64.
# 4 MB is a generous upper bound that accommodates any reasonable webcam resolution
# while preventing memory exhaustion from multi-megabyte or synthetic payloads.
_MAX_IMAGE_B64_CHARS = 4 * 1024 * 1024       # 4 MB base64 string (~3 MB raw)

# 16kHz mono 16-bit PCM for 30 seconds base64-encodes to ~1.3 MB.
# 5 MB cap allows up to ~1 minute of audio, well above any legitimate exam chunk.
_MAX_AUDIO_B64_CHARS = 5 * 1024 * 1024       # 5 MB base64 string


class AnalyzeRequest(BaseModel):
    # secure-code-guardian: max_length enforced at Pydantic validation layer
    # before any image decoding or ML inference runs.
    image: str = Field(
        ...,
        max_length=_MAX_IMAGE_B64_CHARS,
        description="Base64-encoded JPEG/PNG webcam frame (max 4 MB base64)",
    )

    # Optional: only run identity verification if a reference embedding is
    # supplied (from a prior /infer/identity/embed call at enrollment).
    reference_embedding: list[float] | None = None

    # Optional: only run voice-activity analysis if an audio chunk is
    # supplied — base64 16-bit PCM WAV, mono, 16000 Hz (see
    # app/core/audio.py for why that format specifically).
    audio: str | None = Field(
        default=None,
        max_length=_MAX_AUDIO_B64_CHARS,
        description="Base64 16-bit PCM WAV, mono 16kHz (max 5 MB base64)",
    )

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