from pydantic import BaseModel


class DetectedObject(BaseModel):
    label: str
    confidence: float
    x: int
    y: int
    width: int
    height: int


class ObjectInferenceResponse(BaseModel):
    objects: list[DetectedObject]           # every detection above threshold
    unauthorized_objects: list[DetectedObject]  # subset matching the watchlist
    flagged: bool