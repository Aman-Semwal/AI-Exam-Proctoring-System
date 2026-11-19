from pydantic import BaseModel


class GazeInferenceResponse(BaseModel):
    face_detected: bool

    # Head-pose angles in degrees, relative to a camera looking straight at
    # the candidate. None when no face was found to estimate pose from.
    yaw: float | None = None    # left/right head turn
    pitch: float | None = None  # up/down head tilt
    roll: float | None = None   # side-to-side head tilt (ear toward shoulder)

    # Horizontal iris position within the eye socket, averaged over both
    # eyes: 0.0 = looking as far left as the eye allows, 0.5 = centered,
    # 1.0 = looking as far right as the eye allows. None if not computable
    # (no face, or eyes not clearly resolved).
    gaze_horizontal_ratio: float | None = None

    looking_away: bool
    # Comma-separated trigger tags, e.g. "head_turned", "eyes_averted",
    # "head_turned,eyes_averted", "no_face_detected". None when attentive.
    reason: str | None = None