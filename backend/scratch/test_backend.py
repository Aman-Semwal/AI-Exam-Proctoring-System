import requests
import json
import base64
import time

BASE_URL = "http://localhost:8080/api"

# 0. Register SUPER_ADMIN and Create Organization
super_admin_data = {
    "name": "Super Admin",
    "email": f"super_{time.time()}@test.com",
    "password": "password123",
    "role": "SUPER_ADMIN"
}
res = requests.post(f"{BASE_URL}/auth/register", json=super_admin_data)
if res.status_code not in (200, 201):
    print("Super admin register failed:", res.text)
    exit(1)
super_token = res.json()["data"]["token"]

headers_super = {"Authorization": f"Bearer {super_token}"}
org_data = {
    "name": f"Test Org {time.time()}",
    "slug": f"test-org-{int(time.time())}",
    "plan": "PREMIUM"
}
res = requests.post(f"{BASE_URL}/organizations", json=org_data, headers=headers_super)
if res.status_code != 201 and res.status_code != 200:
    print("Create org failed:", res.text)
    exit(1)
org_id = res.json()["data"]["id"]
print(f"Organization created with ID {org_id}.")

# 1. Register Examiner
examiner_data = {
    "name": "Test Examiner",
    "email": f"examiner_{time.time()}@test.com",
    "password": "password123",
    "role": "EXAM_CREATOR",
    "orgId": org_id
}
res = requests.post(f"{BASE_URL}/auth/register", json=examiner_data)
if res.status_code != 201 and res.status_code != 200:
    print("Examiner register failed:", res.text)
    exit(1)
examiner_token = res.json()["data"]["token"]
print("Examiner registered.")

# 2. Register Student
student_data = {
    "name": "Test Student",
    "email": f"student_{time.time()}@test.com",
    "password": "password123",
    "role": "STUDENT",
    "orgId": org_id
}
res = requests.post(f"{BASE_URL}/auth/register", json=student_data)
if res.status_code != 201 and res.status_code != 200:
    print("Student register failed:", res.text)
    exit(1)
student_token = res.json()["data"]["token"]
print("Student registered.")

# 3. Create Exam (as Examiner)
exam_data = {
    "title": "Test Exam",
    "description": "Integration test exam",
    "durationMinutes": 60,
    "startTime": "placeholder",
    "endTime": "placeholder"
}
from datetime import datetime, timezone, timedelta
now_utc = datetime.now(timezone.utc)
exam_data["startTime"] = (now_utc + timedelta(seconds=5)).strftime("%Y-%m-%dT%H:%M:%S")
exam_data["endTime"] = (now_utc + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%S")
headers_examiner = {"Authorization": f"Bearer {examiner_token}"}
res = requests.post(f"{BASE_URL}/exams", json=exam_data, headers=headers_examiner)
if res.status_code != 201 and res.status_code != 200:
    print("Create exam failed:", res.text)
    exit(1)
exam_id = res.json()["data"]["id"]
print(f"Exam created with ID {exam_id}.")
# 3.5 Assign all students to exam (as Examiner)
res = requests.post(f"{BASE_URL}/assignments/exam/{exam_id}/assign-all", headers=headers_examiner)
if res.status_code != 201 and res.status_code != 200:
    print("Assign students failed:", res.text)
    exit(1)
print("Students assigned to exam. Waiting 6 seconds for exam to start...")
time.sleep(6)

# 4. Start Session (as Student)
session_data = {
    "examId": exam_id
}
headers_student = {"Authorization": f"Bearer {student_token}"}
res = requests.post(f"{BASE_URL}/sessions/start", json=session_data, headers=headers_student)
if res.status_code != 201 and res.status_code != 200:
    print("Start session failed:", res.text)
    exit(1)
session_id = res.json()["data"]["id"]
print(f"Session started with ID {session_id}.")

# 5. Send frame for proctoring (as Student)
# Read the test_payload.json which contains base64 image data
with open("../ai-service/test_payload.json", "r") as f:
    payload = json.load(f)

# Wait, the AI service expects "image": "...", but the Java backend expects "frameBase64": "..."
frame_b64 = payload["image"]
if frame_b64.startswith("data:image"):
    frame_b64 = frame_b64.split(",")[1]

proctor_data = {
    "sessionId": session_id,
    "frameBase64": frame_b64
}
res = requests.post(f"{BASE_URL}/proctor/frame", json=proctor_data, headers=headers_student)
if res.status_code != 201 and res.status_code != 200:
    print("Proctor frame failed:", res.text)
    exit(1)
    
print("Proctoring result:", res.json())
