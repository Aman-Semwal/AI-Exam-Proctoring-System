import base64


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_detects_one_face(client, face_image_b64):
    resp = client.post("/infer/face", json={"image": face_image_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["face_count"] == 1
    assert len(body["faces"]) == 1
    face = body["faces"][0]
    assert set(face.keys()) == {"x", "y", "width", "height", "confidence"}
    assert 0.0 <= face["confidence"] <= 1.0
    assert face["width"] > 0 and face["height"] > 0


def test_no_face_in_blank_image(client, blank_image_b64):
    resp = client.post("/infer/face", json={"image": blank_image_b64})
    assert resp.status_code == 200
    assert resp.json() == {"face_count": 0, "faces": []}


def test_missing_image_field_returns_422(client):
    resp = client.post("/infer/face", json={})
    assert resp.status_code == 422


def test_empty_image_string_returns_400(client):
    resp = client.post("/infer/face", json={"image": ""})
    assert resp.status_code == 400
    assert "required" in resp.json()["detail"].lower()


def test_invalid_base64_returns_400(client):
    resp = client.post("/infer/face", json={"image": "not-valid-base64!!!"})
    assert resp.status_code == 400
    assert "base64" in resp.json()["detail"].lower()


def test_valid_base64_non_image_returns_400(client):
    garbage = base64.b64encode(b"this is not an image").decode()
    resp = client.post("/infer/face", json={"image": garbage})
    assert resp.status_code == 400
    assert "decode" in resp.json()["detail"].lower()


def test_response_contract_matches_spring_dto(client, face_image_b64):
    """Guards the exact field names the Spring backend's FaceInferenceResult
    DTO deserializes into. Renaming these breaks the backend silently
    (WebClient just gets nulls, not an error) so this is worth locking down.
    """
    resp = client.post("/infer/face", json={"image": face_image_b64})
    body = resp.json()
    assert "face_count" in body
    assert "faces" in body
    if body["faces"]:
        assert set(body["faces"][0].keys()) == {"x", "y", "width", "height", "confidence"}