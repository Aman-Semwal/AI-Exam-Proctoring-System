import cv2
import mediapipe as mp

mp_face = mp.solutions.face_detection
face_detector = mp_face.FaceDetection(model_selection=0, min_detection_confidence=0.5)

cap = cv2.VideoCapture(0)  # 0 = your default webcam

while True:
    ok, frame = cap.read()
    if not ok:
        break

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_detector.process(rgb_frame)

    face_count = len(result.detections) if result.detections else 0
    print("Faces detected:", face_count)

    cv2.putText(frame, f"Faces: {face_count}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.imshow("Face Detection Test", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()