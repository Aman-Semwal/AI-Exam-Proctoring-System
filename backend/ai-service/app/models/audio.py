from pydantic import BaseModel


class AudioRequest(BaseModel):
    audio: str  # base64-encoded 16-bit PCM WAV, mono, 16000 Hz


class VoiceActivityResponse(BaseModel):
    speech_detected: bool
    # Fraction of analyzed 32ms windows classified as speech (probability
    # > 0.5). Not the same as speech_detected's own threshold — exposed
    # raw so the caller can apply a stricter/looser bar if needed without
    # another round trip.
    speech_fraction: float
    mean_confidence: float
    duration_seconds: float