"""One-time build step: downloads the pretrained Silero VAD model
(16kHz variant) so the voice-activity endpoint can run through
onnxruntime alone — no torch, no `silero-vad` package needed at serve
time (that package pulls in torch + torchaudio, which is a lot of weight
just to run a 1.3MB model).

Uses only the standard library, same as download_arcface_model.py — this
is a straight file fetch, not a model export/conversion.

Usage:
    python scripts/download_silero_vad.py

Output: models/silero_vad.onnx (~1.3 MB)
"""

import urllib.request
from pathlib import Path

MODEL_URL = (
    "https://raw.githubusercontent.com/snakers4/silero-vad/master/"
    "src/silero_vad/data/silero_vad_16k_op15.onnx"
)
OUTPUT_PATH = Path(__file__).parent.parent / "models" / "silero_vad.onnx"


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    print(f"Downloading {MODEL_URL} ...")
    with urllib.request.urlopen(MODEL_URL, timeout=60) as response:
        model_bytes = response.read()

    OUTPUT_PATH.write_bytes(model_bytes)
    print(f"Saved {len(model_bytes) / 1_000_000:.2f} MB to: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()