"""Gaze / head-pose deviation detection using MediaPipe Face Mesh.

Two independent signals are combined:

1. Head pose (yaw/pitch/roll), estimated with the standard OpenCV
   solvePnP six-point technique: a fixed generic 3D face model is fit
   against six 2D landmarks (nose tip, chin, eye corners, mouth corners),
   which yields a rotation vector we convert to Euler angles. This catches
   a candidate turning their head away from the screen.

2. Iris position within the eye socket (MediaPipe's refined landmarks
   include iris landmarks), which catches a candidate keeping their head
   still but glancing off-screen with just their eyes — a case head pose
   alone would miss.

The FaceMesh model itself lives in app/core/landmarks.py and is shared
with identity_service.py — see that module for why.
"""

import cv2
import numpy as np

from app.core.landmarks import get_face_landmarks
from app.models.gaze import GazeInferenceResponse

# Landmark indices into MediaPipe's 478-point face mesh.
_NOSE_TIP = 1
_CHIN = 152
_LEFT_EYE_OUTER = 33
_LEFT_EYE_INNER = 133
_RIGHT_EYE_OUTER = 263
_RIGHT_EYE_INNER = 362
_LEFT_MOUTH = 61
_RIGHT_MOUTH = 291
_LEFT_IRIS = 468
_RIGHT_IRIS = 473

# Generic 3D face model (arbitrary units — only relative proportions
# matter for solvePnP). Standard six-point set used across most
# OpenCV/MediaPipe head-pose references.
_MODEL_POINTS = np.array(
    [
        (0.0, 0.0, 0.0),        # nose tip
        (0.0, -330.0, -65.0),   # chin
        (-225.0, 170.0, -135.0),  # left eye outer corner
        (225.0, 170.0, -135.0),   # right eye outer corner
        (-150.0, -150.0, -125.0),  # left mouth corner
        (150.0, -150.0, -125.0),   # right mouth corner
    ],
    dtype=np.float64,
)

# Thresholds (degrees / ratio) beyond which we call it a deviation.
# Chosen conservatively to avoid flagging normal micro-movements —
# a proctor reviewing evidence cares about sustained, clear deviation,
# not every frame where someone blinked or shifted slightly.
_YAW_THRESHOLD_DEG = 25.0
_PITCH_THRESHOLD_DEG = 20.0
_GAZE_RATIO_LOW = 0.35
_GAZE_RATIO_HIGH = 0.65


def _correct_pitch(pitch: float) -> float:
    """cv2.decomposeProjectionMatrix reports pitch wrapped near +-180 for
    faces roughly facing the camera. This is a well-known quirk of that
    method; the standard correction folds it back into a -90..90 range.
    """
    if pitch < -90:
        return -(180 + pitch)
    if pitch > 90:
        return 180 - pitch
    return pitch


def _eye_ratio(landmarks, outer_idx: int, inner_idx: int, iris_idx: int) -> float:
    outer_x = landmarks[outer_idx].x
    inner_x = landmarks[inner_idx].x
    iris_x = landmarks[iris_idx].x
    lo, hi = min(outer_x, inner_x), max(outer_x, inner_x)
    if hi <= lo:
        return 0.5
    return float(np.clip((iris_x - lo) / (hi - lo), 0.0, 1.0))


def estimate_gaze(frame: np.ndarray) -> GazeInferenceResponse:
    height, width = frame.shape[:2]
    landmarks = get_face_landmarks(frame)

    if landmarks is None:
        return GazeInferenceResponse(
            face_detected=False,
            looking_away=True,
            reason="no_face_detected",
        )

    image_points = np.array(
        [
            (landmarks[i].x * width, landmarks[i].y * height)
            for i in (_NOSE_TIP, _CHIN, _LEFT_EYE_OUTER, _RIGHT_EYE_OUTER, _LEFT_MOUTH, _RIGHT_MOUTH)
        ],
        dtype=np.float64,
    )

    focal_length = width
    center = (width / 2, height / 2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]], [0, focal_length, center[1]], [0, 0, 1]],
        dtype=np.float64,
    )
    dist_coeffs = np.zeros((4, 1))

    success, rotation_vector, translation_vector = cv2.solvePnP(
        _MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )

    if not success:
        # Pose couldn't be solved (degenerate landmark geometry) — treat as
        # a deviation since we can't confirm attentiveness.
        return GazeInferenceResponse(
            face_detected=True,
            looking_away=True,
            reason="pose_estimation_failed",
        )

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    projection_matrix = np.hstack((rotation_matrix, translation_vector))
    euler_angles = cv2.decomposeProjectionMatrix(projection_matrix)[6]
    pitch, yaw, roll = (float(a) for a in euler_angles.flatten())
    pitch = _correct_pitch(pitch)

    left_ratio = _eye_ratio(landmarks, _LEFT_EYE_OUTER, _LEFT_EYE_INNER, _LEFT_IRIS)
    right_ratio = _eye_ratio(landmarks, _RIGHT_EYE_OUTER, _RIGHT_EYE_INNER, _RIGHT_IRIS)
    gaze_ratio = round((left_ratio + right_ratio) / 2, 4)

    reasons = []
    if abs(yaw) > _YAW_THRESHOLD_DEG:
        reasons.append("head_turned")
    if abs(pitch) > _PITCH_THRESHOLD_DEG:
        reasons.append("head_tilted")
    # Only trust the iris signal when the head is roughly frontal — once
    # the head itself is turned, iris position relative to the (also
    # rotated) eye socket isn't a reliable independent signal anymore.
    if abs(yaw) <= _YAW_THRESHOLD_DEG and (gaze_ratio < _GAZE_RATIO_LOW or gaze_ratio > _GAZE_RATIO_HIGH):
        reasons.append("eyes_averted")

    return GazeInferenceResponse(
        face_detected=True,
        yaw=round(yaw, 2),
        pitch=round(pitch, 2),
        roll=round(roll, 2),
        gaze_horizontal_ratio=gaze_ratio,
        looking_away=bool(reasons),
        reason=",".join(reasons) if reasons else None,
    )