import base64
import struct
import wave
import io

import numpy as np

from app.services.audio_service import summarize


# --- Pure helper function tests (fast, no model inference) ---


def test_summarize_empty_probabilities():
    speech_detected, fraction, confidence = summarize([])
    assert speech_detected is False
    assert fraction == 0.0
    assert confidence == 0.0


def test_summarize_all_high_confidence():
    speech_detected, fraction, confidence = summarize([0.9, 0.95, 0.85, 0.92])
    assert speech_detected is True
    assert fraction == 1.0
    assert confidence > 0.8


def test_summarize_all_low_confidence():
    speech_detected, fraction, confidence = summarize([0.01, 0.02, 0.01, 0.03])
    assert speech_detected is False
    assert fraction == 0.0


def test_summarize_mixed_below_fraction_threshold():
    # one high window out of ten shouldn't itself flip speech_detected —
    # the fraction (0.1) sits right at the threshold boundary, not above it
    probs = [0.9] + [0.1] * 9
    speech_detected, fraction, _ = summarize(probs)
    assert fraction == 0.1
    assert speech_detected is False  # threshold is strictly-greater-than


# --- Endpoint integration tests ---


def test_voice_activity_on_real_speech(client, speech_audio_b64):
    resp = client.post("/infer/audio/voice-activity", json={"audio": speech_audio_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["speech_detected"] is True
    assert body["speech_fraction"] > 0.5  # validated: real speech scores ~0.77 on this clip
    assert body["mean_confidence"] > 0.5
    assert abs(body["duration_seconds"] - 3.0) < 0.1


def test_voice_activity_on_silence(client, silence_audio_b64):
    resp = client.post("/infer/audio/voice-activity", json={"audio": silence_audio_b64})
    assert resp.status_code == 200
    body = resp.json()
    assert body["speech_detected"] is False
    assert body["speech_fraction"] < 0.05
    assert body["mean_confidence"] < 0.05


def test_voice_activity_missing_field_returns_422(client):
    resp = client.post("/infer/audio/voice-activity", json={})
    assert resp.status_code == 422


def test_voice_activity_invalid_base64_returns_400(client):
    resp = client.post("/infer/audio/voice-activity", json={"audio": "not-valid-base64!!!"})
    assert resp.status_code == 400
    assert "base64" in resp.json()["detail"].lower()


def test_voice_activity_non_wav_bytes_returns_400(client):
    garbage = base64.b64encode(b"this is not a wav file").decode()
    resp = client.post("/infer/audio/voice-activity", json={"audio": garbage})
    assert resp.status_code == 400


def test_voice_activity_wrong_sample_rate_returns_400(client):
    # valid WAV, but 8000 Hz instead of the required 16000 Hz
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(8000)
        wf.writeframes(struct.pack("<800h", *([0] * 800)))
    audio_b64 = base64.b64encode(buf.getvalue()).decode()

    resp = client.post("/infer/audio/voice-activity", json={"audio": audio_b64})
    assert resp.status_code == 400
    assert "16000" in resp.json()["detail"]


def test_voice_activity_too_short_returns_400(client):
    # valid WAV, correct sample rate, but under the 512-sample minimum
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        wf.writeframes(struct.pack("<100h", *([0] * 100)))
    audio_b64 = base64.b64encode(buf.getvalue()).decode()

    resp = client.post("/infer/audio/voice-activity", json={"audio": audio_b64})
    assert resp.status_code == 400
    assert "too short" in resp.json()["detail"].lower()


def test_voice_activity_stereo_downmixes_without_error(client):
    # valid stereo WAV at the correct rate — should downmix to mono and
    # succeed rather than error
    buf = io.BytesIO()
    n_samples = 1600
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(16000)
        interleaved = [0] * (n_samples * 2)
        wf.writeframes(struct.pack(f"<{len(interleaved)}h", *interleaved))
    audio_b64 = base64.b64encode(buf.getvalue()).decode()

    resp = client.post("/infer/audio/voice-activity", json={"audio": audio_b64})
    assert resp.status_code == 200