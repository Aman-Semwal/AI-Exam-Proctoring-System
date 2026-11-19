import base64

from app.models.analysis import Severity, Violation
from app.services.analysis_service import _severity_from_score


# --- Pure severity-scoring tests (fast, no model inference) ---


def test_severity_zero_score_is_none():
    assert _severity_from_score(0) == Severity.NONE


def test_severity_bands():
    # LOW's upper bound is 19, not 15 -- see the comment on
    # _severity_from_score for why (headroom above a bare NO_FACE
    # violation's 15 points, so it doesn't sit exactly on the boundary).
    assert _severity_from_score(1) == Severity.LOW
    assert _severity_from_score(15) == Severity.LOW
    assert _severity_from_score(19) == Severity.LOW
    assert _severity_from_score(20) == Severity.MEDIUM
    assert _severity_from_score(35) == Severity.MEDIUM
    assert _severity_from_score(36) == Severity.HIGH
    assert _severity_from_score(60) == Severity.HIGH
    assert _severity_from_score(61) == Severity.CRITICAL
    assert _severity_from_score(1000) == Severity.CRITICAL


# --- Endpoint integration tests ---


def test_analyze_on_blank_image_flags_no_face(client, blank_image_b64):
    resp = client.post("/infer/analyze", json={"image": blank_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert Violation.NO_FACE.value in body["violations"]
    assert Violation.LOOKING_AWAY.value not in body["violations"]  # guarded against double-count
    assert body["severity_score"] == 15
    assert body["severity_level"] == "LOW"
    assert body["identity"] is None  # no reference_embedding supplied
    assert body["voice_activity"] is None  # no audio supplied


def test_analyze_on_clean_real_face_has_no_violations(client, real_face_image_b64):
    resp = client.post("/infer/analyze", json={"image": real_face_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face"]["face_count"] == 1
    assert body["violations"] == []
    assert body["severity_score"] == 0
    assert body["severity_level"] == "NONE"


def test_analyze_includes_identity_check_when_reference_embedding_supplied(client, real_face_image_b64):
    embed_resp = client.post("/infer/identity/embed", json={"image": real_face_image_b64})
    reference_embedding = embed_resp.json()["embedding"]

    resp = client.post(
        "/infer/analyze",
        json={"image": real_face_image_b64, "reference_embedding": reference_embedding},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["identity"] is not None
    assert body["identity"]["match"] is True
    assert Violation.IDENTITY_MISMATCH.value not in body["violations"]


def test_analyze_flags_identity_mismatch_against_wrong_embedding(client, real_face_image_b64):
    from app.models.identity import EMBEDDING_DIM

    # a deliberately wrong reference embedding (all zeros, L2-normalized
    # concept doesn't apply to an all-zero vector, but that's fine — it
    # just needs to be clearly not the real face's embedding)
    wrong_embedding = [0.0] * EMBEDDING_DIM
    wrong_embedding[0] = 1.0

    resp = client.post(
        "/infer/analyze",
        json={"image": real_face_image_b64, "reference_embedding": wrong_embedding},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["identity"]["match"] is False
    assert Violation.IDENTITY_MISMATCH.value in body["violations"]
    assert body["severity_score"] >= 40


def test_analyze_includes_voice_activity_when_audio_supplied(client, real_face_image_b64, speech_audio_b64):
    resp = client.post(
        "/infer/analyze",
        json={"image": real_face_image_b64, "audio": speech_audio_b64},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["voice_activity"] is not None
    assert body["voice_activity"]["speech_detected"] is True
    # voice activity is informational only — never contributes to the score
    assert "voice" not in " ".join(body["violations"]).lower()


def test_analyze_missing_image_returns_422(client):
    resp = client.post("/infer/analyze", json={})
    assert resp.status_code == 422


def test_analyze_invalid_base64_image_returns_400(client):
    resp = client.post("/infer/analyze", json={"image": "not-valid-base64!!!"})
    assert resp.status_code == 400


def test_analyze_rejects_wrong_length_reference_embedding(client, real_face_image_b64):
    resp = client.post(
        "/infer/analyze",
        json={"image": real_face_image_b64, "reference_embedding": [0.1, 0.2, 0.3]},
    )
    assert resp.status_code == 422


def test_analyze_invalid_audio_returns_400(client, real_face_image_b64):
    resp = client.post(
        "/infer/analyze",
        json={"image": real_face_image_b64, "audio": "not-valid-base64!!!"},
    )
    assert resp.status_code == 400