# ---- Stage 1: export YOLOv8n weights to ONNX ----
# torch + ultralytics are needed to do this conversion, but NOT to serve
# requests afterward — the running service only needs the resulting ~12MB
# .onnx file plus onnxruntime (see requirements.txt and
# app/services/object_service.py for the full reasoning). Keeping this in
# its own stage means torch, torchvision, ultralytics, and the CUDA
# dependency chain pulled in with them never end up in the final image.
FROM python:3.11-slim AS onnx-export
WORKDIR /export
RUN pip install --no-cache-dir --timeout=300 \
    torch==2.13.0 \
    torchvision==0.28.0 \
    ultralytics==8.4.115
# ultralytics pulls in full opencv-python, which needs GUI-related system
# libs (libGL, libxcb, etc.) that python:3.11-slim doesn't have. Rather
# than apt-get installing them here (this hit Docker Desktop build-time
# memory limits in testing), swap to the headless build: same `cv2` API
# ultralytics needs for image I/O, none of the GUI dependencies, no
# apt-get needed in this stage at all.
RUN pip uninstall -y opencv-python && \
    pip install --no-cache-dir opencv-python-headless
COPY scripts/export_yolo_onnx.py scripts/export_yolo_onnx.py
RUN python scripts/export_yolo_onnx.py

# ---- Stage 2: the actual service ----
FROM python:3.11-slim AS runtime

WORKDIR /app

# System deps for OpenCV and MediaPipe. Retries/timeout added because the
# Debian mirror has shown transient flakiness during builds.
RUN apt-get update -o Acquire::Retries=5 -o Acquire::http::Timeout=30 \
    && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r requirements.txt

COPY . .
COPY --from=onnx-export /export/models/yolov8n.onnx models/yolov8n.onnx

# ArcFace recognition weights (identity verification) — a plain download +
# zip-extract using only the standard library (see
# scripts/download_arcface_model.py), no extra build stage needed since
# nothing heavy has to be installed just to fetch a file.
RUN python scripts/download_arcface_model.py

# Silero VAD weights (voice activity detection) — same reasoning, plain
# stdlib download, no torch/silero-vad package needed at serve time.
RUN python scripts/download_silero_vad.py

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ---- Stage 3: test image ----
FROM runtime AS test
RUN pip install --no-cache-dir --timeout=300 --retries=5 -r requirements-dev.txt