"""Combines the individual detector outputs (face, gaze, objects, and
optionally identity + voice-activity) into one violation list and a
single severity score/level.

This is business-rule aggregation over already-real ML outputs, not a new
model of its own — each signal feeding the score came from a genuine
detector elsewhere in this service (MediaPipe face/gaze, YOLOv8n via
ONNX, ArcFace via ONNX, Silero VAD via ONNX). This module's only job is
combining them into one number a proctor/backend can act on, instead of
making the caller stitch together five separate responses itself.

Two design notes worth being explicit about:

1. face_service.py (BlazeFace, via mediapipe.solutions.face_detection)
   and gaze_service.py (FaceMesh, via app/core/landmarks.py) are two
   different models and can disagree at the margins — e.g. face_service
   might report one face present while FaceMesh fails to resolve
   landmarks on the same frame, which gaze_service reports as
   looking_away=True with reason "no_face_detected". To avoid
   double-counting what's really one underlying "no face" situation as
   two separate violations, LOOKING_AWAY is only evaluated when
   face_service itself found exactly one face.

2. Voice activity is intentionally NOT factored into the severity score.
   Detecting that *some* speech occurred isn't itself a reliable
   violation signal without knowing whose voice it is (this service does
   voice-activity detection, not diarization — see the audio_service.py
   module docstring for why multi-speaker detection isn't implemented
   here). voice_activity is still returned in the response so the
   backend/a human reviewer has it as context, just not auto-scored.

The point values and severity bands below are a reasonable starting
point, not something calibrated against real exam-session data — no such
dataset exists in this codebase to calibrate against (same caveat as
identity_service.py's match threshold). Tune them once real proctoring
sessions produce data worth tuning against.
"""

from app.core.audio import decode_wav_audio
from app.core.frame import decode_frame
from app.models.analysis import AnalyzeRequest, AnalyzeResponse, Severity, Violation
from app.models.audio import VoiceActivityResponse
from app.models.face import FaceInferenceResponse
from app.models.identity import VerifyResponse
from app.models.object import ObjectInferenceResponse
from app.services.audio_service import SAMPLE_RATE, WINDOW_SAMPLES, get_speech_probabilities, summarize
from app.services.face_service import detect_faces
from app.services.gaze_service import estimate_gaze
from app.services.identity_service import cosine_similarity, get_embedding, is_match
from app.services.object_service import detect_objects, split_unauthorized
from fastapi import HTTPException
import numpy as np

# Point values and band cutoffs below are hand-set, not calibrated --
# there is no equivalent to the identity-threshold Olivetti benchmark for
# "how severe is this violation pattern in an exam context"; that is a
# policy call needing real session data or a judgment call on relative
# severity, not something measurable from a public dataset. Revisit once
# real session data exists.
#
# The relative ORDERING here is deliberate though: identity mismatch
# (wrong person entirely) > unauthorized object (clear cheating tool) >
# multiple faces (possible collusion) > no face (often just a camera/
# lighting glitch) > looking away (a passing glance). That ordering is
# independent of the exact point values and unlikely to need revisiting
# even once real numbers replace these.
_VIOLATION_POINTS = {
    Violation.NO_FACE: 15,
    Violation.MULTIPLE_FACES: 25,
    Violation.LOOKING_AWAY: 10,
    Violation.UNAUTHORIZED_OBJECT: 30,
    Violation.IDENTITY_MISMATCH: 40,
}


def _severity_from_score(score: int) -> Severity:
    # LOW's upper bound is 19, not exactly 15 (NO_FACE's point value).
    # A single NO_FACE violation used to land exactly on the LOW/MEDIUM
    # boundary -- fragile, since the single most likely false-positive-
    # prone violation (a camera glitch or brief lighting dropout, not
    # necessarily real cheating) would tip into MEDIUM the moment any
    # other point value in _VIOLATION_POINTS above ever changed by even
    # 1. Giving it 4 points of headroom keeps a bare NO_FACE unambiguously
    # LOW without that boundary being one edit away from silently
    # reclassifying it. This is the one adjustment made without real
    # session data -- a robustness fix, not a calibration; the underlying
    # point values above are still the same uncalibrated hand-set numbers.
    if score == 0:
        return Severity.NONE
    if score <= 19:
        return Severity.LOW
    if score <= 35:
        return Severity.MEDIUM
    if score <= 60:
        return Severity.HIGH
    return Severity.CRITICAL


def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    frame = decode_frame(req.image)

    faces = detect_faces(frame)
    face_result = FaceInferenceResponse(face_count=len(faces), faces=faces)

    gaze_result = estimate_gaze(frame)

    detected_objects = detect_objects(frame)
    unauthorized_objects = split_unauthorized(detected_objects)
    object_result = ObjectInferenceResponse(
        objects=detected_objects,
        unauthorized_objects=unauthorized_objects,
        flagged=bool(unauthorized_objects),
    )

    identity_result: VerifyResponse | None = None
    if req.reference_embedding is not None:
        embedding = get_embedding(frame)
        if embedding is None:
            identity_result = VerifyResponse(face_detected=False, match=False, similarity=None)
        else:
            reference = np.array(req.reference_embedding, dtype=np.float32)
            similarity = cosine_similarity(embedding, reference)
            identity_result = VerifyResponse(
                face_detected=True, match=is_match(similarity), similarity=round(similarity, 4)
            )

    voice_result: VoiceActivityResponse | None = None
    if req.audio is not None:
        samples = decode_wav_audio(req.audio)
        if len(samples) < WINDOW_SAMPLES:
            min_ms = round(WINDOW_SAMPLES / SAMPLE_RATE * 1000)
            raise HTTPException(status_code=400, detail=f"Audio too short — need at least {min_ms}ms")
        probabilities = get_speech_probabilities(samples)
        speech_detected, speech_fraction, mean_confidence = summarize(probabilities)
        voice_result = VoiceActivityResponse(
            speech_detected=speech_detected,
            speech_fraction=round(speech_fraction, 4),
            mean_confidence=round(mean_confidence, 4),
            duration_seconds=round(len(samples) / SAMPLE_RATE, 3),
        )

    violations: list[Violation] = []
    if face_result.face_count == 0:
        violations.append(Violation.NO_FACE)
    elif face_result.face_count > 1:
        violations.append(Violation.MULTIPLE_FACES)

    # See module docstring point 1 — only evaluated when face_service
    # itself found exactly one face, to avoid double-counting a
    # cross-model "no face" disagreement as two separate violations.
    if face_result.face_count == 1 and gaze_result.looking_away:
        violations.append(Violation.LOOKING_AWAY)

    if object_result.flagged:
        violations.append(Violation.UNAUTHORIZED_OBJECT)

    if identity_result is not None and identity_result.face_detected and not identity_result.match:
        violations.append(Violation.IDENTITY_MISMATCH)

    score = sum(_VIOLATION_POINTS[v] for v in violations)

    return AnalyzeResponse(
        face=face_result,
        gaze=gaze_result,
        objects=object_result,
        identity=identity_result,
        voice_activity=voice_result,
        violations=violations,
        severity_score=score,
        severity_level=_severity_from_score(score),
    )