"""One-time build step: downloads pretrained YOLOv8n (COCO-80) weights and
exports them to ONNX so the service can run object detection via
onnxruntime alone, without needing torch/ultralytics installed at serve
time (see app/services/object_service.py for why that split exists).

This script itself needs torch + ultralytics installed, but the running
service does not — install those two packages temporarily just to run
this, then they can be uninstalled again.

Usage:
    pip install torch ultralytics
    python scripts/export_yolo_onnx.py

Output: models/yolov8n.onnx (~12 MB)
"""

import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

from ultralytics import YOLO

YOLO_WEIGHTS_URL = "https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.pt"
OUTPUT_PATH = Path(__file__).parent.parent / "models" / "yolov8n.onnx"
WEIGHTS_PATH = Path("yolov8n.pt")
MAX_ATTEMPTS = 5
INITIAL_BACKOFF_SECONDS = 3


def _download_weights_if_missing():
    if WEIGHTS_PATH.exists() and WEIGHTS_PATH.stat().st_size > 1_000_000:
        return
    request = urllib.request.Request(
        YOLO_WEIGHTS_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; ai-exam-proctoring-build-script/1.0)"},
    )
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            print(f"Downloading {YOLO_WEIGHTS_URL} (attempt {attempt}/{MAX_ATTEMPTS}) ...")
            with urllib.request.urlopen(request, timeout=120) as response, open(WEIGHTS_PATH, "wb") as out_file:
                shutil.copyfileobj(response, out_file, length=64 * 1024)
            size_mb = WEIGHTS_PATH.stat().st_size / 1_000_000
            print(f"Downloaded {size_mb:.1f} MB")
            return
        except (urllib.error.URLError, ConnectionError, TimeoutError) as exc:
            last_error = exc
            if attempt == MAX_ATTEMPTS:
                break
            backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
            print(f"Download failed ({exc!r}); retrying in {backoff}s ...")
            time.sleep(backoff)
    raise RuntimeError(
        f"Failed to download {YOLO_WEIGHTS_URL} after {MAX_ATTEMPTS} attempts"
    ) from last_error


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    _download_weights_if_missing()
    model = YOLO(str(WEIGHTS_PATH))
    exported_path = model.export(format="onnx", imgsz=640, opset=12, simplify=True)

    exported_path = Path(exported_path)
    if exported_path.resolve() != OUTPUT_PATH.resolve():
        exported_path.replace(OUTPUT_PATH)

    print(f"Exported ONNX model to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()