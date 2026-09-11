"""One-time build step: downloads the pretrained ArcFace recognition model
(w600k_r50.onnx, part of InsightFace's buffalo_l model pack) so the
identity-verification service can run without needing the `insightface`
Python package (or torch) installed at all — see app/services/
identity_service.py for the full reasoning.

Uses only the standard library (urllib + zipfile), unlike
export_yolo_onnx.py, because this model is already published in ONNX
format directly — there's no conversion step, just an extraction from
InsightFace's release zip.

Retries with backoff: this is a large (~549MB zip) download through a
redirect (github.com -> objects.githubusercontent.com), and dropped
connections mid-handshake (SSLEOFError) are a known flaky pattern on some
Docker Desktop / corporate-network setups. A single transient drop
shouldn't fail the whole image build, so this retries a few times before
giving up. A browser-like User-Agent is set because GitHub's release CDN
occasionally rejects bare urllib requests that don't send one.

Usage:
    python scripts/download_arcface_model.py

Output: models/w600k_r50.onnx (~167 MB)
"""

import shutil
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

MODEL_URL = "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip"
MEMBER_NAME = "w600k_r50.onnx"
OUTPUT_PATH = Path(__file__).parent.parent / "models" / "w600k_r50.onnx"
MAX_ATTEMPTS = 5
INITIAL_BACKOFF_SECONDS = 5


def _download_to_file_with_retries(url: str, dest_path: Path):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; ai-exam-proctoring-build-script/1.0)"},
    )
    last_error: Exception | None = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            print(f"Downloading {url} (attempt {attempt}/{MAX_ATTEMPTS}) ...")
            with urllib.request.urlopen(request, timeout=120) as response, open(dest_path, "wb") as out_file:
                shutil.copyfileobj(response, out_file, length=64 * 1024)
            size_mb = dest_path.stat().st_size / 1_000_000
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
        f"Failed to download {url} after {MAX_ATTEMPTS} attempts"
    ) from last_error


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_zip = OUTPUT_PATH.parent / "buffalo_l_temp.zip"
    try:
        _download_to_file_with_retries(MODEL_URL, temp_zip)
        with zipfile.ZipFile(temp_zip) as archive:
            with archive.open(MEMBER_NAME) as member, open(OUTPUT_PATH, "wb") as out_file:
                shutil.copyfileobj(member, out_file, length=64 * 1024)
        print(f"Extracted {MEMBER_NAME} to: {OUTPUT_PATH}")
    finally:
        if temp_zip.exists():
            temp_zip.unlink()


if __name__ == "__main__":
    main()