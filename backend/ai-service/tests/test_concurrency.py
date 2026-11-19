"""Concurrency tests for the shared MediaPipe FaceMesh instance
(app/core/landmarks.py) and the ONNX Runtime sessions in object_service.py
and audio_service.py. FastAPI dispatches sync `def` routes to a worker
thread pool for concurrent exam sessions, so every shared model instance
here needs to survive genuinely overlapping calls from different threads,
not just sequential calls from one.
"""

import threading

import pytest


def _fire_concurrently(client, calls, iterations=20):
    """Runs `calls` (a list of zero-arg callables, each posting to one
    endpoint) round-robin across `iterations` threads fired at once.
    Returns (results, errors).
    """
    errors = []
    results = []
    lock = threading.Lock()

    def run(call):
        try:
            resp = call()
            with lock:
                results.append(resp.status_code)
        except Exception as exc:  # noqa: BLE001
            with lock:
                errors.append(exc)

    threads = [
        threading.Thread(target=run, args=(calls[i % len(calls)],))
        for i in range(iterations)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=60)

    return results, errors


def test_face_mesh_process_survives_concurrent_calls(real_face_image_b64):
    """/infer/gaze and /infer/identity/embed both route through the same
    shared _face_mesh singleton (app/core/landmarks.py). Without the lock
    in get_face_landmarks(), concurrent process() calls against a single
    MediaPipe FaceMesh instance are a known race -- this segfaulted the
    process entirely when tested without the lock. With the lock, every
    call should complete cleanly and return a self-consistent result.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    calls = [
        lambda: client.post("/infer/gaze", json={"image": real_face_image_b64}),
        lambda: client.post("/infer/identity/embed", json={"image": real_face_image_b64}),
    ]
    results, errors = _fire_concurrently(client, calls, iterations=20)

    assert not errors, f"concurrent calls raised: {errors}"
    assert len(results) == 20
    assert all(status == 200 for status in results), results


def test_onnx_sessions_survive_concurrent_calls(real_face_image_b64, speech_audio_b64):
    """object_service.py (YOLOv8n) and audio_service.py (Silero VAD) each
    hold one module-level ort.InferenceSession, shared across every
    request the same way _face_mesh is. ONNX Runtime documents concurrent
    Run() calls against a single session as supported, unlike MediaPipe --
    this test exists to actually verify that claim against this codebase's
    usage pattern rather than trust the docs on faith, given the FaceMesh
    assumption turned out to be wrong.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    calls = [
        lambda: client.post("/infer/object", json={"image": real_face_image_b64}),
        lambda: client.post("/infer/audio/voice-activity", json={"audio": speech_audio_b64}),
    ]
    results, errors = _fire_concurrently(client, calls, iterations=20)

    assert not errors, f"concurrent calls raised: {errors}"
    assert len(results) == 20
    assert all(status == 200 for status in results), results


def test_analyze_endpoint_survives_concurrent_calls(real_face_image_b64):
    """/infer/analyze fans out to every service in one request (face, gaze,
    object, identity), so it's the closest single-endpoint approximation
    of real load -- several exam sessions each polling this one endpoint
    repeatedly. Exercises every shared singleton at once from many
    threads.
    """
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    calls = [
        lambda: client.post("/infer/analyze", json={"image": real_face_image_b64}),
    ]
    results, errors = _fire_concurrently(client, calls, iterations=15)

    assert not errors, f"concurrent calls raised: {errors}"
    assert len(results) == 15
    assert all(status == 200 for status in results), results