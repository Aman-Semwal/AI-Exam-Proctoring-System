from fastapi import FastAPI
from pydantic import BaseModel
import cv2, numpy as np, base64
import mediapipe as mp

app = FastAPI()
mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

class FrameRequest(BaseModel):
    image: str  # base64-encoded JPEG/PNG

@app.post("/infer/face")
async def detect_face(req: FrameRequest):
    img_bytes = base64.b64decode(req.image)
    np_array = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_detector.process(rgb_frame)
    face_count = len(result.detections) if result.detections else 0
    return {"faces_detected": face_count, "match": None, "confidence": None}