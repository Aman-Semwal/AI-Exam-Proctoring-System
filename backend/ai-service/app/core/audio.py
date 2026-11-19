"""Shared audio-decoding utility for /infer/audio/* endpoints.

Deliberately scoped to 16-bit PCM WAV, mono, 16000 Hz only — not because
that's all that theoretically exists, but because:

- The bundled Silero VAD model requires exactly 16000 Hz (or 8000 Hz)
  input; anything else needs resampling, which would mean adding
  scipy/librosa as a new dependency just for that one conversion. Given
  the browser-side MediaRecorder API can be told to capture at 16kHz
  directly (via a Web Audio API AudioContext + a wav-encoding step before
  sending), it's simpler and lighter to require the client send audio
  already in the right format than to resample server-side.
- Using Python's stdlib `wave` module for parsing avoids pulling in
  soundfile/libsndfile for what is otherwise a very simple, well-defined
  format.

If the frontend integration ends up needing to accept arbitrary
browser-recorded formats (e.g. WebM/Opus) directly, that's a real
follow-up decision — it would need either client-side conversion to WAV
before the API call (recommended, keeps this service lean) or a
server-side transcoding step (ffmpeg), which is a heavier dependency this
service doesn't currently carry.
"""

import base64
import binascii
import io
import wave

import numpy as np
from fastapi import HTTPException

REQUIRED_SAMPLE_RATE = 16000


def decode_wav_audio(audio_b64: str) -> np.ndarray:
    """Decodes a base64 WAV string into a mono float32 array in [-1, 1],
    resampled to nothing (rejects non-16kHz input rather than resampling
    — see module docstring). Raises HTTPException(400) for any malformed
    or unsupported input.
    """
    if not audio_b64:
        raise HTTPException(status_code=400, detail="Audio data is required")

    try:
        audio_bytes = base64.b64decode(audio_b64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Invalid base64 audio data")

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    try:
        with wave.open(io.BytesIO(audio_bytes), "rb") as wf:
            n_channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            frame_rate = wf.getframerate()
            n_frames = wf.getnframes()
            raw_frames = wf.readframes(n_frames)
    except (wave.Error, EOFError):
        raise HTTPException(status_code=400, detail="Could not decode audio (expected WAV/PCM format)")

    if sample_width != 2:
        raise HTTPException(
            status_code=400, detail=f"Only 16-bit PCM WAV is supported (got {sample_width * 8}-bit)"
        )
    if frame_rate != REQUIRED_SAMPLE_RATE:
        raise HTTPException(
            status_code=400,
            detail=f"Audio must be sampled at {REQUIRED_SAMPLE_RATE} Hz (got {frame_rate} Hz)",
        )

    samples = np.frombuffer(raw_frames, dtype=np.int16).astype(np.float32) / 32768.0
    if n_channels > 1:
        samples = samples.reshape(-1, n_channels).mean(axis=1)  # downmix to mono

    return samples