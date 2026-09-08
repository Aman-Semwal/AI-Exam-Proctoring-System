"""Face presence detection using MediaPipe.

The detector used to be a single module-level instance, instantiated once
at import time and reused across every request. That was wrong under
real concurrent load for the same reason app/core/landmarks.py's FaceMesh
singleton was (see that module's docstring for the full investigation):
MediaPipe's Python Solutions objects carry state that isn't safe to share
across threads, and testing showed even fully serializing calls with a
lock wasn't enough -- concurrent /infer/analyze traffic (which calls both
this detector and landmarks.py's FaceMesh in the same request) produced
real CalculatorGraph errors ("Packet type mismatch... Empty packets are
not allowed") under load. Switched to the same fix: one FaceDetection
instance per thread (threading.local), constructed lazily and reused for
that thread's lifetime, with construction itself serialized by a lock
since concurrent construction was also unsafe, not just concurrent
inference.

Per-thread instantiation is still far cheaper than per-request: do not
move this inside the endpoint/handler, only into the thread-local lazy
getter below.
"""

import threading

import cv2
import mediapipe as mp
import numpy as np

from app.models.face import FaceBox

_mp_face = mp.solutions.face_detection
_thread_local = threading.local()
_construction_lock = threading.Lock()


def _get_face_detector():
    detector = getattr(_thread_local, "face_detector", None)
    if detector is None:
        with _construction_lock:
            detector = _mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)
        _thread_local.face_detector = detector
    return detector


def detect_faces(frame: np.ndarray) -> list[FaceBox]:
    """Runs face detection on a single BGR frame and returns pixel-space boxes."""
    height, width = frame.shape[:2]
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    face_detector = _get_face_detector()
    result = face_detector.process(rgb_frame)

    detections = result.detections or []
    faces: list[FaceBox] = []
    for detection in detections:
        box = detection.location_data.relative_bounding_box
        faces.append(
            FaceBox(
                x=max(0, round(box.xmin * width)),
                y=max(0, round(box.ymin * height)),
                width=round(box.width * width),
                height=round(box.height * height),
                confidence=round(detection.score[0], 4) if detection.score else 0.0,
            )
        )
    return faces