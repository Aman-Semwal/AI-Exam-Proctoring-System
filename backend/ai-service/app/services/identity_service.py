"""Face identity verification using ArcFace embeddings (w600k_r50, from
InsightFace's buffalo_l model pack), served through ONNX Runtime.

Design choices worth explaining:

1. Only the recognition model (w600k_r50.onnx, ~167MB) is bundled — not
   InsightFace's own face detector (det_10g.onnx, another ~17MB) or the
   `insightface` Python package itself. ArcFace needs a face precisely
   aligned to a fixed 112x112 template before embedding, which normally
   means running a dedicated detector to get 5 alignment landmarks. But
   this service already runs MediaPipe FaceMesh for gaze detection
   (app/core/landmarks.py) and its landmarks include equivalents for all
   5 points ArcFace alignment needs (eye centers, nose tip, mouth
   corners). Reusing that avoids a second detector model and a second
   detection pass per frame. Validated empirically before committing to
   this: aligning with these MediaPipe-derived points vs InsightFace's
   own detector-based alignment, on the same photo, produced embeddings
   with 0.969 cosine similarity — solidly in "same identity" territory,
   confirming the approximation doesn't cost meaningful accuracy.

2. The model is downloaded once (scripts/download_arcface_model.py) as a
   plain .onnx file — not exported like YOLOv8n, since InsightFace already
   publishes it in ONNX format directly. No torch/insightface package is
   needed at serve time, only onnxruntime, keeping this consistent with
   how object_service.py is structured.

3. On calibrating the match threshold: calibrated against the Olivetti/
   AT&T faces dataset (40 distinct subjects, 10 images each) run through
   this exact pipeline — 1,800 genuine (same-subject) pairs and 78,000
   impostor (different-subject) pairs. Genuine similarities ranged
   0.4044-0.96 (mean 0.799); impostor similarities ranged up to 0.3533
   (mean 0.030) — a clean, non-overlapping gap. 0.38 sits centered in
   that gap (0% FAR / 0% FRR on this dataset, same as anywhere in
   0.354-0.404). Chosen slightly below the genuine floor rather than
   right up against it (the previous 0.40 sat only 0.004 above it) to
   leave more headroom against false rejects once real webcam frames —
   noisier and more variably lit than these controlled studio photos —
   replace this benchmark's clean conditions. Re-run against real
   enrollment/verification pairs once that data exists; this is a real
   measurement, not a guess, but still on a proxy dataset.
"""

from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from app.core.landmarks import get_face_landmarks

_MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "w600k_r50.onnx"
_ALIGNED_SIZE = 112

_session = ort.InferenceSession(str(_MODEL_PATH), providers=["CPUExecutionProvider"])
_input_name = _session.get_inputs()[0].name

# MediaPipe FaceMesh landmark indices used to approximate the 5-point
# ArcFace alignment set (eye centers, nose tip, mouth corners). Eye
# centers are approximated as the midpoint of each eye's outer+inner
# corner — same landmark indices gaze_service.py uses for its own
# eye-corner geometry.
_LEFT_EYE_OUTER, _LEFT_EYE_INNER = 33, 133
_RIGHT_EYE_OUTER, _RIGHT_EYE_INNER = 263, 362
_NOSE_TIP = 1
_LEFT_MOUTH, _RIGHT_MOUTH = 61, 291

# Standard ArcFace 112x112 reference template (left eye, right eye, nose
# tip, left mouth corner, right mouth corner). This exact set of
# coordinates is the widely-published InsightFace alignment template used
# across essentially every ArcFace-based implementation.
_REFERENCE_TEMPLATE = np.array(
    [
        [38.2946, 51.6963],
        [73.5318, 51.5014],
        [56.0252, 71.7366],
        [41.5493, 92.3655],
        [70.7299, 92.2041],
    ],
    dtype=np.float32,
)

# See module docstring point 3 — calibrated against the Olivetti benchmark.
_MATCH_THRESHOLD = 0.38


def _get_alignment_points(landmarks, width: int, height: int) -> np.ndarray:
    def pt(idx: int) -> np.ndarray:
        return np.array([landmarks[idx].x * width, landmarks[idx].y * height], dtype=np.float32)

    left_eye = (pt(_LEFT_EYE_OUTER) + pt(_LEFT_EYE_INNER)) / 2
    right_eye = (pt(_RIGHT_EYE_OUTER) + pt(_RIGHT_EYE_INNER)) / 2
    nose_tip = pt(_NOSE_TIP)
    left_mouth = pt(_LEFT_MOUTH)
    right_mouth = pt(_RIGHT_MOUTH)

    return np.array([left_eye, right_eye, nose_tip, left_mouth, right_mouth], dtype=np.float32)


def _align_face(frame: np.ndarray, landmarks) -> np.ndarray | None:
    height, width = frame.shape[:2]
    src_points = _get_alignment_points(landmarks, width, height)

    transform, _ = cv2.estimateAffinePartial2D(src_points, _REFERENCE_TEMPLATE, method=cv2.LMEDS)
    if transform is None:
        return None

    return cv2.warpAffine(frame, transform, (_ALIGNED_SIZE, _ALIGNED_SIZE), borderValue=0.0)


def get_embedding(frame: np.ndarray) -> np.ndarray | None:
    """Returns a 512-dim L2-normalized ArcFace embedding for the primary
    face in `frame`, or None if no face was found or alignment failed.
    """
    landmarks = get_face_landmarks(frame)
    if landmarks is None:
        return None

    aligned = _align_face(frame, landmarks)
    if aligned is None:
        return None

    rgb = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
    blob = (rgb.astype(np.float32) - 127.5) / 127.5
    blob = blob.transpose(2, 0, 1)[None]  # HWC -> CHW, add batch dim

    embedding = _session.run(None, {_input_name: blob})[0][0]
    norm = np.linalg.norm(embedding)
    if norm == 0:
        return None
    return embedding / norm


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b))


def is_match(similarity: float) -> bool:
    return similarity >= _MATCH_THRESHOLD