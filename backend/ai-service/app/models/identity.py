from pydantic import BaseModel, field_validator

EMBEDDING_DIM = 512


class EmbedRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG


class EmbedResponse(BaseModel):
    face_detected: bool
    # 512-dim L2-normalized ArcFace embedding. None if no face was found.
    # The caller (Spring backend) stores this once at exam enrollment and
    # sends it back on every /infer/identity/verify call — the AI service
    # itself holds no per-candidate state.
    embedding: list[float] | None = None


class VerifyRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG
    reference_embedding: list[float]  # from a prior /infer/identity/embed call

    @field_validator("reference_embedding")
    @classmethod
    def _validate_embedding_length(cls, value: list[float]) -> list[float]:
        if len(value) != EMBEDDING_DIM:
            raise ValueError(f"reference_embedding must have exactly {EMBEDDING_DIM} values, got {len(value)}")
        return value


class VerifyResponse(BaseModel):
    face_detected: bool
    match: bool
    # Cosine similarity in [-1, 1] between the reference and current-frame
    # embeddings. None if no face was found in the current frame.
    similarity: float | None = None