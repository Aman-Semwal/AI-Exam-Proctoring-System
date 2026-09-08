"""Shared image-decoding utility for all AI inference endpoints.

Every /infer/* endpoint receives a base64-encoded JPEG/PNG frame and needs
the same validation + decode step before it can run its own model on the
resulting array. Centralizing it here means new endpoints (gaze, object,
identity, audio-frame-adjacent work) get the same error handling for free
instead of re-implementing it.
"""

import base64
import binascii

import cv2
import numpy as np
from fastapi import HTTPException


def decode_frame(image_b64: str) -> np.ndarray:
    """Decodes a base64 image string into a BGR OpenCV frame.

    Raises HTTPException(400) for any malformed/missing/corrupted input
    instead of letting a raw exception propagate.
    """
    if not image_b64:
        raise HTTPException(status_code=400, detail="Frame data is required")

    try:
        img_bytes = base64.b64decode(image_b64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    if not img_bytes:
        raise HTTPException(status_code=400, detail="Empty image payload")

    np_array = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    if frame is None or frame.size == 0:
        raise HTTPException(status_code=400, detail="Could not decode image (unsupported or corrupted format)")

    return frame