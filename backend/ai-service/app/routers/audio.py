from fastapi import APIRouter, HTTPException

from app.core.audio import decode_wav_audio
from app.models.audio import AudioRequest, VoiceActivityResponse
from app.services.audio_service import SAMPLE_RATE, WINDOW_SAMPLES, get_speech_probabilities, summarize

router = APIRouter(prefix="/infer/audio", tags=["audio"])


@router.post("/voice-activity", response_model=VoiceActivityResponse)
def detect_voice_activity(req: AudioRequest):
    """Analyzes a short audio chunk for voice activity using Silero VAD.

    Expects base64-encoded 16-bit PCM WAV, mono, sampled at 16000 Hz —
    see app/core/audio.py for why other formats/rates are rejected rather
    than silently resampled.

    Plain (sync) function for the same reason as the other /infer/*
    endpoints: synchronous CPU-bound inference with no await points, and
    FastAPI dispatches sync path operations to a worker thread pool
    automatically so concurrent requests don't block each other.
    """
    samples = decode_wav_audio(req.audio)
    if len(samples) < WINDOW_SAMPLES:
        min_ms = round(WINDOW_SAMPLES / SAMPLE_RATE * 1000)
        raise HTTPException(status_code=400, detail=f"Audio too short — need at least {min_ms}ms")

    probabilities = get_speech_probabilities(samples)
    speech_detected, speech_fraction, mean_confidence = summarize(probabilities)

    return VoiceActivityResponse(
        speech_detected=speech_detected,
        speech_fraction=round(speech_fraction, 4),
        mean_confidence=round(mean_confidence, 4),
        duration_seconds=round(len(samples) / SAMPLE_RATE, 3),
    )