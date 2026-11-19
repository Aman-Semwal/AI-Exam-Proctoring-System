"""One-time build step: downloads the pretrained ArcFace recognition model
(w600k_r50.onnx, part of InsightFace's buffalo_l model pack) so the
identity-verification service can run without needing the `insightface`
Python package (or torch) installed at all — see app/services/
identity_service.py for the full reasoning.

Uses only the standard library (urllib + zipfile + hashlib), unlike
export_yolo_onnx.py, because this model is already published in ONNX
format directly — there's no conversion step, just an extraction from
InsightFace's release zip.

secure-code-guardian: SHA-256 hash of the extracted ONNX file is verified
after download. A compromised CDN or MITM substituting a different model
binary would produce a different hash and abort the build with a clear
error. The expected hash was recorded from the official buffalo_l release
(v0.7) — re-verify and update if InsightFace publishes a new release.

Retries with backoff: this is a large (~549MB zip) download through a
redirect (github.com -> objects.githubusercontent.com), and dropped
connections mid-handshake (SSLEOFError) are a known flaky pattern on some
Docker Desktop / corporate-network setups.

Usage:
    python scripts/download_arcface_model.py

Output: models/w600k_r50.onnx (~167 MB)
"""

import hashlib
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

# secure-code-guardian: SHA-256 of the extracted w600k_r50.onnx from buffalo_l v0.7.
# Verify with: sha256sum models/w600k_r50.onnx
# Update this value whenever InsightFace publishes a new official release.
EXPECTED_SHA256 = "4c06341c33c2ca1f86781dab0e829f88ad5b64be9fba56e56bc9ebdefc619e43"


def _sha256_file(path: Path) -> str:
    """Compute the SHA-256 hex digest of a file without loading it all into memory."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def _verify_integrity(path: Path, expected: str) -> None:
    """Verify the file's SHA-256 matches the expected hash.

    Raises RuntimeError with a clear message if the check fails so the
    Docker build layer aborts immediately rather than running with a
    potentially tampered model.
    """
    if expected.startswith("placeholder"):
        print(
            "WARNING: EXPECTED_SHA256 is a placeholder — skipping integrity check. "
            "Record the real hash with: sha256sum models/w600k_r50.onnx "
            "and update this script before deploying to production."
        )
        return
    actual = _sha256_file(path)
    if actual != expected:
        path.unlink(missing_ok=True)  # remove the bad file
        raise RuntimeError(
            f"Integrity check FAILED for {path.name}!\n"
            f"  Expected SHA-256: {expected}\n"
            f"  Actual   SHA-256: {actual}\n"
            "The downloaded file may have been tampered with or is corrupt. "
            "Do NOT use this model."
        )
    print(f"Integrity check passed — SHA-256: {actual}")


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
        # secure-code-guardian: verify integrity of extracted model
        _verify_integrity(OUTPUT_PATH, EXPECTED_SHA256)
    finally:
        if temp_zip.exists():
            temp_zip.unlink()


if __name__ == "__main__":
    main()