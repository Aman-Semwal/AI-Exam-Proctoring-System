import numpy as np
from fastapi import APIRouter

from app.core.frame import decode_frame
from app.models.identity import EmbedRequest, EmbedResponse, VerifyRequest, VerifyResponse
from app.services.identity_service import cosine_similarity, get_embedding, is_match

router = APIRouter(prefix="/infer/identity", tags=["identity"])


@router.post("/embed", response_model=EmbedResponse)
def embed_face(req: EmbedRequest):
    """Extracts a 512-dim face embedding from a single frame — used once at
    exam enrollment. The backend stores the resulting embedding and sends
    it back on every subsequent /verify call; this service keeps no
    per-candidate state itself.
    """
    frame = decode_frame(req.image)
    embedding = get_embedding(frame)
    if embedding is None:
        return EmbedResponse(face_detected=False, embedding=None)
    return EmbedResponse(face_detected=True, embedding=embedding.tolist())


@router.post("/verify", response_model=VerifyResponse)
def verify_face(req: VerifyRequest):
    """Compares the current frame's face against a previously-enrolled
    reference embedding and reports whether they match.

    Plain (sync) function for the same reason as the other /infer/*
    endpoints: synchronous CPU-bound inference with no await points, and
    FastAPI dispatches sync path operations to a worker thread pool
    automatically so concurrent requests don't block each other.
    """
    frame = decode_frame(req.image)
    embedding = get_embedding(frame)
    if embedding is None:
        return VerifyResponse(face_detected=False, match=False, similarity=None)

    reference = np.array(req.reference_embedding, dtype=np.float32)
    similarity = cosine_similarity(embedding, reference)
    return VerifyResponse(face_detected=True, match=is_match(similarity), similarity=round(similarity, 4))