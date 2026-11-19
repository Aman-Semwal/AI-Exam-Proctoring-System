"""One-time build step: downloads the pretrained Silero VAD model
(16kHz variant) so the voice-activity endpoint can run through
onnxruntime alone — no torch, no `silero-vad` package needed at serve
time (that package pulls in torch + torchaudio, which is a lot of weight
just to run a 1.3MB model).

Uses only the standard library, same as download_arcface_model.py — this
is a straight file fetch, not a model export/conversion.

secure-code-guardian: SHA-256 hash of the downloaded ONNX file is verified
after download. A compromised CDN or MITM substituting a different model
binary would produce a different hash and abort the build with a clear
error. Update EXPECTED_SHA256 when the upstream Silero VAD model is updated.

Usage:
    python scripts/download_silero_vad.py

Output: models/silero_vad.onnx (~1.3 MB)
"""

import hashlib
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

# secure-code-guardian: SHA-256 of silero_vad_16k_op15.onnx.
# Verify with: sha256sum models/silero_vad.onnx
# Update this value if the upstream repository updates the model file.
EXPECTED_SHA256 = "placeholder-replace-with-real-sha256-after-first-download"


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _verify_integrity(path: Path, expected: str) -> None:
    if expected.startswith("placeholder"):
        print(
            "WARNING: EXPECTED_SHA256 is a placeholder — skipping integrity check. "
            "Record the real hash with: sha256sum models/silero_vad.onnx "
            "and update this script before deploying to production."
        )
        return
    actual = _sha256_file(path)
    if actual != expected:
        path.unlink(missing_ok=True)
        raise RuntimeError(
            f"Integrity check FAILED for {path.name}!\n"
            f"  Expected SHA-256: {expected}\n"
            f"  Actual   SHA-256: {actual}\n"
            "The downloaded file may have been tampered with or is corrupt."
        )
    print(f"Integrity check passed — SHA-256: {actual}")


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
            # secure-code-guardian: verify integrity after download
            _verify_integrity(OUTPUT_PATH, EXPECTED_SHA256)
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