import base64

from app.models.identity import EMBEDDING_DIM
from app.services.identity_service import cosine_similarity, is_match


# --- Pure helper function tests (fast, no model inference) ---


def test_cosine_similarity_identical_vectors():
    import numpy as np

    v = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    assert abs(cosine_similarity(v, v) - 1.0) < 1e-6


def test_cosine_similarity_orthogonal_vectors():
    import numpy as np

    a = np.array([1.0, 0.0], dtype=np.float32)
    b = np.array([0.0, 1.0], dtype=np.float32)
    assert abs(cosine_similarity(a, b)) < 1e-6


def test_is_match_above_threshold():
    assert is_match(0.9) is True


def test_is_match_below_threshold():
    assert is_match(0.1) is False


# --- Endpoint integration tests ---


def test_embed_on_real_face(client, real_face_image_b64):
    resp = client.post("/infer/identity/embed", json={"image": real_face_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_detected"] is True
    assert body["embedding"] is not None
    assert len(body["embedding"]) == EMBEDDING_DIM


def test_embed_on_blank_image(client, blank_image_b64):
    resp = client.post("/infer/identity/embed", json={"image": blank_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_detected"] is False
    assert body["embedding"] is None


def test_embed_missing_image_field_returns_422(client):
    resp = client.post("/infer/identity/embed", json={})
    assert resp.status_code == 422


def test_embed_invalid_base64_returns_400(client):
    resp = client.post("/infer/identity/embed", json={"image": "not-valid-base64!!!"})
    assert resp.status_code == 400


def test_verify_same_photo_matches_itself(client, real_face_image_b64):
    """The strongest possible sanity check: embedding a photo and then
    verifying that exact same photo against its own embedding should be
    a near-perfect match (same alignment, same pixels, fully deterministic
    inference — this isn't testing recognition robustness, just that the
    embed -> verify round trip is internally consistent).
    """
    embed_resp = client.post("/infer/identity/embed", json={"image": real_face_image_b64})
    reference_embedding = embed_resp.json()["embedding"]

    verify_resp = client.post(
        "/infer/identity/verify",
        json={"image": real_face_image_b64, "reference_embedding": reference_embedding},
    )
    assert verify_resp.status_code == 200
    body = verify_resp.json()
    assert body["face_detected"] is True
    assert body["match"] is True
    # Not asserting near-1.0: _face_mesh runs in static_image_mode=False
    # (the right choice for continuous webcam tracking — it reuses prior-
    # frame context to track faster/smoother than re-detecting from
    # scratch every call), which means landmark positions aren't
    # perfectly deterministic run-to-run even on the exact same image.
    # Still expect a very high, clearly-same-identity score.
    assert body["similarity"] > 0.9


def test_verify_no_face_in_current_frame(client, blank_image_b64, real_face_image_b64):
    embed_resp = client.post("/infer/identity/embed", json={"image": real_face_image_b64})
    reference_embedding = embed_resp.json()["embedding"]

    resp = client.post(
        "/infer/identity/verify",
        json={"image": blank_image_b64, "reference_embedding": reference_embedding},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_detected"] is False
    assert body["match"] is False
    assert body["similarity"] is None


def test_verify_rejects_wrong_length_embedding(client, real_face_image_b64):
    resp = client.post(
        "/infer/identity/verify",
        json={"image": real_face_image_b64, "reference_embedding": [0.1, 0.2, 0.3]},
    )
    assert resp.status_code == 422


def test_verify_missing_reference_embedding_returns_422(client, real_face_image_b64):
    resp = client.post("/infer/identity/verify", json={"image": real_face_image_b64})
    assert resp.status_code == 422


def test_verify_invalid_base64_returns_400(client):
    resp = client.post(
        "/infer/identity/verify",
        json={"image": "not-valid-base64!!!", "reference_embedding": [0.0] * EMBEDDING_DIM},
    )
    assert resp.status_code == 400