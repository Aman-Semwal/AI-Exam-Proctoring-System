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

from pathlib import Path

from ultralytics import YOLO

OUTPUT_PATH = Path(__file__).parent.parent / "models" / "yolov8n.onnx"


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    model = YOLO("yolov8n.pt")  # downloads pretrained COCO weights if not cached
    exported_path = model.export(format="onnx", imgsz=640, opset=12, simplify=True)

    exported_path = Path(exported_path)
    if exported_path.resolve() != OUTPUT_PATH.resolve():
        exported_path.replace(OUTPUT_PATH)

    print(f"Exported ONNX model to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()