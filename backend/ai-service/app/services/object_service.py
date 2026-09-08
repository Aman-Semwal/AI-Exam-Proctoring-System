"""Unauthorized-object detection using a YOLOv8n model, served through ONNX
Runtime rather than the full ultralytics/torch stack.

Why ONNX Runtime instead of `ultralytics.YOLO(...)` directly: the trained
weights (yolov8n.pt, pretrained on COCO) are exported to ONNX once as a
build step (see `scripts/export_yolo_onnx.py`), and only the ~12MB .onnx
file ships with the service. Torch + ultralytics + torchvision + their
CUDA dependency chain add well over a GB to the image and aren't needed to
just *run* a fixed pretrained model — onnxruntime alone is enough, which
keeps the container lean and startup fast, both of which matter for a
service that needs to handle bursts of concurrent exam sessions.

The session is created once at import and reused across requests, same
pattern as face_service.py / gaze_service.py.
"""

from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from app.models.object import DetectedObject

_MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "yolov8n.onnx"
_INPUT_SIZE = 640

_session = ort.InferenceSession(str(_MODEL_PATH), providers=["CPUExecutionProvider"])
_input_name = _session.get_inputs()[0].name

# Standard COCO-80 class order, matching the pretrained yolov8n weights
# these ONNX weights were exported from.
_COCO_CLASSES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush",
]

# Objects that are plausible exam-integrity violations if they appear in
# frame. Deliberately excludes "laptop"/"keyboard"/"mouse"/"tv" — those are
# almost certainly the candidate's own exam device and would false-positive
# on every frame if watched. "person" is excluded too: face_service.py
# already handles multi-face detection with a purpose-built model, and its
# result is more reliable for that specific question than a general object
# detector's "person" box would be.
_WATCHLIST = {"cell phone", "book", "remote"}

_CONFIDENCE_THRESHOLD = 0.45
_NMS_IOU_THRESHOLD = 0.45


def _letterbox(frame: np.ndarray, size: int = _INPUT_SIZE):
    """Resizes frame to fit in a size x size square without distorting
    aspect ratio, padding the remainder with neutral gray (114,114,114) —
    the standard YOLO preprocessing convention, matching how the model was
    trained/exported.
    """
    height, width = frame.shape[:2]
    scale = min(size / height, size / width)
    new_h, new_w = round(height * scale), round(width * scale)
    resized = cv2.resize(frame, (new_w, new_h))

    canvas = np.full((size, size, 3), 114, dtype=np.uint8)
    pad_x, pad_y = (size - new_w) // 2, (size - new_h) // 2
    canvas[pad_y:pad_y + new_h, pad_x:pad_x + new_w] = resized
    return canvas, scale, pad_x, pad_y


def detect_objects(frame: np.ndarray) -> list[DetectedObject]:
    canvas, scale, pad_x, pad_y = _letterbox(frame)

    blob = canvas[:, :, ::-1].astype(np.float32) / 255.0  # BGR -> RGB, normalize
    blob = blob.transpose(2, 0, 1)[None]  # HWC -> CHW, add batch dim

    raw_output = _session.run(None, {_input_name: blob})[0]  # (1, 84, 8400)
    predictions = raw_output[0].T  # (8400, 84): 4 box coords + 80 class scores

    boxes_xywh = predictions[:, :4]
    class_scores = predictions[:, 4:]
    class_ids = np.argmax(class_scores, axis=1)
    confidences = class_scores[np.arange(len(class_scores)), class_ids]

    keep = confidences > _CONFIDENCE_THRESHOLD
    if not np.any(keep):
        return []

    boxes_xywh = boxes_xywh[keep]
    confidences = confidences[keep]
    class_ids = class_ids[keep]

    # center-form (cx, cy, w, h) -> corner-form (x, y, w, h), still in the
    # 640x640 letterboxed/padded coordinate space
    x1 = boxes_xywh[:, 0] - boxes_xywh[:, 2] / 2
    y1 = boxes_xywh[:, 1] - boxes_xywh[:, 3] / 2
    nms_input = np.stack([x1, y1, boxes_xywh[:, 2], boxes_xywh[:, 3]], axis=1)

    kept_indices = cv2.dnn.NMSBoxes(
        nms_input.tolist(), confidences.tolist(), _CONFIDENCE_THRESHOLD, _NMS_IOU_THRESHOLD
    )

    detections: list[DetectedObject] = []
    for i in np.array(kept_indices).flatten():
        bx, by, bw, bh = nms_input[i]
        # undo letterbox scale + padding to get original-frame pixel coords
        orig_x = (bx - pad_x) / scale
        orig_y = (by - pad_y) / scale
        orig_w = bw / scale
        orig_h = bh / scale

        detections.append(
            DetectedObject(
                label=_COCO_CLASSES[class_ids[i]],
                confidence=round(float(confidences[i]), 4),
                x=max(0, round(orig_x)),
                y=max(0, round(orig_y)),
                width=round(orig_w),
                height=round(orig_h),
            )
        )
    return detections


def split_unauthorized(objects: list[DetectedObject]) -> list[DetectedObject]:
    return [obj for obj in objects if obj.label in _WATCHLIST]