"""Voice activity detection using Silero VAD (16kHz variant), served
through ONNX Runtime.

The model is stateful/streaming by design (see the context-prepending
protocol below) — each request here is still evaluated statelessly
relative to *other* requests (state resets to zero at the start of every
call), since each API call represents one independent audio chunk, not a
continuous session-spanning stream. That mirrors how every other
/infer/* endpoint in this service treats each request/frame as
self-contained.

The exact preprocessing protocol below (prepending 64 samples of
prior-window context before each 512-sample window, then keeping the
last 64 samples of that concatenated input as context for the next
window) is not optional plumbing — omitting it silently produces
near-zero speech probability on real speech. Validated directly: a naive
per-window pass without context scored ~0.001 mean probability on known
speech audio; with context, the same audio scored ~0.78-0.80 mean
probability with correctly-classified speech windows. This came from
Silero's own reference implementation (the OnnxWrapper class in their
utils_vad.py), not guessed.
"""

from pathlib import Path

import numpy as np
import onnxruntime as ort

_MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "silero_vad.onnx"
_session = ort.InferenceSession(str(_MODEL_PATH), providers=["CPUExecutionProvider"])

SAMPLE_RATE = 16000
WINDOW_SAMPLES = 512
_CONTEXT_SAMPLES = 64
_SPEECH_PROB_THRESHOLD = 0.5
# Fraction of analyzed windows that must be classified as speech before
# the whole chunk is reported as containing speech. Set well below 0.5 so
# a chunk that's mostly quiet with a short utterance in it still counts —
# requiring most windows to be speech would miss exactly the kind of
# brief exam-room speech this is meant to catch.
_SPEECH_FRACTION_THRESHOLD = 0.1


def get_speech_probabilities(samples: np.ndarray) -> list[float]:
    """Runs the model over `samples` in sequential 512-sample windows,
    returning one speech-probability value per window.
    """
    state = np.zeros((2, 1, 128), dtype=np.float32)
    context = np.zeros((1, _CONTEXT_SAMPLES), dtype=np.float32)
    sr_input = np.array(SAMPLE_RATE, dtype=np.int64)

    probabilities = []
    for start in range(0, len(samples) - WINDOW_SAMPLES + 1, WINDOW_SAMPLES):
        chunk = samples[start:start + WINDOW_SAMPLES][None, :].astype(np.float32)
        model_input = np.concatenate([context, chunk], axis=1)
        out, state = _session.run(None, {"input": model_input, "state": state, "sr": sr_input})
        context = model_input[:, -_CONTEXT_SAMPLES:]
        probabilities.append(float(out[0][0]))
    return probabilities


def summarize(probabilities: list[float]) -> tuple[bool, float, float]:
    """Returns (speech_detected, speech_fraction, mean_confidence)."""
    if not probabilities:
        return False, 0.0, 0.0
    probs = np.array(probabilities)
    speech_fraction = float(np.mean(probs > _SPEECH_PROB_THRESHOLD))
    mean_confidence = float(np.mean(probs))
    return speech_fraction > _SPEECH_FRACTION_THRESHOLD, speech_fraction, mean_confidence