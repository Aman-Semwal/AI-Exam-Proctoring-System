from fastapi import FastAPI, UploadFile
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI()

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

@app.post("/infer/face")
async def detect_face(file: UploadFile):
    # Read the uploaded image into something OpenCV understands
    contents = await file.read()
    np_array = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(np_array, cv2.IMREAD_COLOR)

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_detector.process(rgb_frame)

    face_count = len(result.detections) if result.detections else 0

    return {
        "faces_detected": face_count,
        "match": None,       # we'll fill this in later, once identity-matching is added
        "confidence": None
    }