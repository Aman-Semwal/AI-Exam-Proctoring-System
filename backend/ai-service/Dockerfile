FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV and MediaPipe
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Heavy packages pehle install karo (torch ~2GB) — timeout 300s
RUN pip install --no-cache-dir --timeout=300 \
    torch==2.13.0 \
    torchvision==0.28.0
# Baaki sab packages
RUN pip install --no-cache-dir --timeout=300 -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
