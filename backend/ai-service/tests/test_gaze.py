import base64

from app.services.gaze_service import _correct_pitch, _eye_ratio


# --- Pure helper function tests (fast, no model inference) ---


def test_correct_pitch_wraps_near_negative_180():
    # A near-frontal face often reports pitch near -165..-180 due to the
    # decomposeProjectionMatrix convention; this should fold back near 0.
    assert abs(_correct_pitch(-165.0) - (-15.0)) < 1e-9


def test_correct_pitch_wraps_near_positive_180():
    assert abs(_correct_pitch(170.0) - 10.0) < 1e-9


def test_correct_pitch_leaves_normal_range_untouched():
    assert _correct_pitch(-10.0) == -10.0
    assert _correct_pitch(45.0) == 45.0


class _FakeLandmark:
    def __init__(self, x: float):
        self.x = x


def test_eye_ratio_centered():
    landmarks = {0: _FakeLandmark(0.0), 1: _FakeLandmark(1.0), 2: _FakeLandmark(0.5)}
    assert abs(_eye_ratio(landmarks, 0, 1, 2) - 0.5) < 1e-9


def test_eye_ratio_iris_at_outer_edge():
    landmarks = {0: _FakeLandmark(0.0), 1: _FakeLandmark(1.0), 2: _FakeLandmark(0.0)}
    assert abs(_eye_ratio(landmarks, 0, 1, 2) - 0.0) < 1e-9


def test_eye_ratio_degenerate_corners_returns_center_default():
    # outer == inner corner (shouldn't happen with real landmarks, but the
    # function must not divide by zero if it ever does)
    landmarks = {0: _FakeLandmark(0.5), 1: _FakeLandmark(0.5), 2: _FakeLandmark(0.5)}
    assert _eye_ratio(landmarks, 0, 1, 2) == 0.5


# --- Endpoint integration tests ---


def test_gaze_on_frontal_real_face(client, real_face_image_b64):
    resp = client.post("/infer/gaze", json={"image": real_face_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_detected"] is True
    assert body["yaw"] is not None
    assert body["pitch"] is not None
    assert body["roll"] is not None
    assert body["gaze_horizontal_ratio"] is not None
    # A roughly frontal, centered photo shouldn't trip either threshold.
    assert body["looking_away"] is False
    assert body["reason"] is None


def test_gaze_no_face_in_blank_image(client, blank_image_b64):
    resp = client.post("/infer/gaze", json={"image": blank_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_detected"] is False
    assert body["looking_away"] is True
    assert body["reason"] == "no_face_detected"
    assert body["yaw"] is None


def test_gaze_missing_image_field_returns_422(client):
    resp = client.post("/infer/gaze", json={})
    assert resp.status_code == 422


def test_gaze_invalid_base64_returns_400(client):
    resp = client.post("/infer/gaze", json={"image": "not-valid-base64!!!"})
    assert resp.status_code == 400
    assert "base64" in resp.json()["detail"].lower()


def test_gaze_valid_base64_non_image_returns_400(client):
    garbage = base64.b64encode(b"this is not an image").decode()
    resp = client.post("/infer/gaze", json={"image": garbage})
    assert resp.status_code == 400
    assert "decode" in resp.json()["detail"].lower()