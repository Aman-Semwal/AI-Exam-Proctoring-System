import base64
from pathlib import Path

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app

_FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


def _to_b64_jpeg(frame: np.ndarray) -> str:
    ok, buf = cv2.imencode(".jpg", frame)
    assert ok
    return base64.b64encode(buf.tobytes()).decode()


@pytest.fixture(scope="session")
def face_image_b64() -> str:
    """A synthetic but MediaPipe-detectable frontal face.

    Built procedurally (skin-toned oval + eyes + mouth) so the test suite
    has no external image dependency. MediaPipe's short-range model reliably
    fires on this kind of high-contrast synthetic face at model_selection=0.
    """
    frame = np.full((480, 480, 3), 200, dtype=np.uint8)  # light background
    center = (240, 240)
    cv2.ellipse(frame, center, (110, 150), 0, 0, 360, (170, 190, 220), -1)  # face
    cv2.circle(frame, (195, 210), 14, (60, 60, 60), -1)  # left eye
    cv2.circle(frame, (285, 210), 14, (60, 60, 60), -1)  # right eye
    cv2.ellipse(frame, (240, 300), (40, 18), 0, 0, 180, (90, 60, 90), 4)  # mouth
    return _to_b64_jpeg(frame)


@pytest.fixture(scope="session")
def blank_image_b64() -> str:
    """A flat blank frame — no detectable face."""
    frame = np.zeros((200, 200, 3), dtype=np.uint8)
    return _to_b64_jpeg(frame)


@pytest.fixture(scope="session")
def real_face_image_b64() -> str:
    """A real, roughly-frontal photograph (public domain: U.S. Navy photo
    of Grace Hopper, via Wikimedia Commons — bundled as matplotlib's
    standard sample image, reused here as a test fixture).

    Head-pose/gaze estimation needs anatomically real landmark geometry to
    produce meaningful angles, unlike plain face-presence detection which
    tolerates the procedural synthetic face fine. A drawn ellipse face
    still triggers FaceMesh's detector, but its landmark positions aren't
    representative of a real head, so it's not reliable for pose-angle
    assertions.
    """
    data = (_FIXTURES_DIR / "sample_face.jpg").read_bytes()
    return base64.b64encode(data).decode()

@pytest.fixture(scope="session")
def speech_audio_b64() -> str:
    """3 seconds of real human speech, 16-bit PCM WAV mono 16kHz —
    trimmed from silero-vad's own test fixture (MIT licensed:
    github.com/snakers4/silero-vad, tests/data/test.wav). Synthetic tones
    don't exercise VAD meaningfully; this validates against genuine
    speech the same way sample_face.jpg validates against a genuine face.
    """
    data = (_FIXTURES_DIR / "speech_3s.wav").read_bytes()
    return base64.b64encode(data).decode()


@pytest.fixture(scope="session")
def silence_audio_b64() -> str:
    """3 seconds of digital silence, 16-bit PCM WAV mono 16kHz."""
    data = (_FIXTURES_DIR / "silence_3s.wav").read_bytes()
    return base64.b64encode(data).decode()