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

import shutil
import time
import urllib.error
import urllib.request
from pathlib import Path

MODEL_URL = (
    "https://raw.githubusercontent.com/snakers4/silero-vad/master/"
    "src/silero_vad/data/silero_vad_16k_op15.onnx"
)
OUTPUT_PATH = Path(__file__).parent.parent / "models" / "silero_vad.onnx"
MAX_ATTEMPTS = 5
INITIAL_BACKOFF_SECONDS = 3


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        MODEL_URL,
        headers={"User-Agent": "Mozilla/5.0 (compatible; ai-exam-proctoring-build-script/1.0)"},
    )
    last_error = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            print(f"Downloading {MODEL_URL} (attempt {attempt}/{MAX_ATTEMPTS}) ...")
            with urllib.request.urlopen(request, timeout=60) as response, open(OUTPUT_PATH, "wb") as out_file:
                shutil.copyfileobj(response, out_file, length=64 * 1024)
            size_mb = OUTPUT_PATH.stat().st_size / 1_000_000
            print(f"Saved {size_mb:.2f} MB to: {OUTPUT_PATH}")
            return
        except (urllib.error.URLError, ConnectionError, TimeoutError) as exc:
            last_error = exc
            if attempt == MAX_ATTEMPTS:
                break
            backoff = INITIAL_BACKOFF_SECONDS * (2 ** (attempt - 1))
            print(f"Download failed ({exc!r}); retrying in {backoff}s ...")
            time.sleep(backoff)
    raise RuntimeError(
        f"Failed to download {MODEL_URL} after {MAX_ATTEMPTS} attempts"
    ) from last_error


if __name__ == "__main__":
    main()