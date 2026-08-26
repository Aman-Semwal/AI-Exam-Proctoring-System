import base64

import numpy as np

from app.models.object import DetectedObject
from app.services.object_service import _letterbox, split_unauthorized


# --- Pure helper function tests (fast, no model inference) ---


def test_letterbox_preserves_aspect_ratio_wide_image():
    frame = np.zeros((200, 400, 3), dtype=np.uint8)  # 2:1 landscape
    canvas, scale, pad_x, pad_y = _letterbox(frame, size=640)
    assert canvas.shape == (640, 640, 3)
    # width is the limiting dimension, so height gets padded (pad_y > 0),
    # width should fill the frame exactly (pad_x == 0)
    assert pad_x == 0
    assert pad_y > 0
    assert round(400 * scale) == 640


def test_letterbox_preserves_aspect_ratio_tall_image():
    frame = np.zeros((400, 200, 3), dtype=np.uint8)  # 1:2 portrait
    canvas, scale, pad_x, pad_y = _letterbox(frame, size=640)
    assert pad_y == 0
    assert pad_x > 0
    assert round(400 * scale) == 640


def _obj(label: str) -> DetectedObject:
    return DetectedObject(label=label, confidence=0.9, x=0, y=0, width=10, height=10)


def test_split_unauthorized_filters_to_watchlist_only():
    objects = [_obj("person"), _obj("cell phone"), _obj("laptop"), _obj("book")]
    unauthorized = split_unauthorized(objects)
    assert {o.label for o in unauthorized} == {"cell phone", "book"}


def test_split_unauthorized_empty_when_nothing_matches():
    objects = [_obj("person"), _obj("laptop"), _obj("keyboard")]
    assert split_unauthorized(objects) == []


def test_split_unauthorized_empty_input():
    assert split_unauthorized([]) == []


# --- Endpoint integration tests ---


def test_object_detection_on_real_photo(client, real_face_image_b64):
    resp = client.post("/infer/object", json={"image": real_face_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    # A portrait photo should detect at least a person; "person" isn't on
    # the watchlist (face_service.py already owns that signal), so it
    # should show up in `objects` but not trip `flagged`.
    assert any(o["label"] == "person" for o in body["objects"])
    assert body["flagged"] is False
    assert body["unauthorized_objects"] == []
    for obj in body["objects"]:
        assert set(obj.keys()) == {"label", "confidence", "x", "y", "width", "height"}
        assert 0.0 <= obj["confidence"] <= 1.0


def test_object_detection_on_blank_image(client, blank_image_b64):
    resp = client.post("/infer/object", json={"image": blank_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["objects"] == []
    assert body["unauthorized_objects"] == []
    assert body["flagged"] is False


def test_object_missing_image_field_returns_422(client):
    resp = client.post("/infer/object", json={})
    assert resp.status_code == 422


def test_object_invalid_base64_returns_400(client):
    resp = client.post("/infer/object", json={"image": "not-valid-base64!!!"})
    assert resp.status_code == 400
    assert "base64" in resp.json()["detail"].lower()


def test_object_valid_base64_non_image_returns_400(client):
    garbage = base64.b64encode(b"this is not an image").decode()
    resp = client.post("/infer/object", json={"image": garbage})
    assert resp.status_code == 400
    assert "decode" in resp.json()["detail"].lower()