package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Deserializes the complete response from the AI service's {@code POST /infer/analyze}.
 *
 * <p>This is the single DTO that replaces the old {@link FaceInferenceResult}-only
 * approach. It carries everything the analysis endpoint returns so
 * {@link com.proctor.proctorbackend.proctoring.AiServiceClient} can hand the full
 * picture to {@code ProctoringServiceImpl} in one call.
 *
 * <p>Field names mirror the Python {@code AnalyzeResponse} Pydantic model
 * ({@code app/models/analysis.py}).
 *
 * <pre>
 * face:           FaceInferenceResponse    — face count + bounding boxes
 * gaze:           GazeInferenceResponse    — head pose + gaze deviation
 * objects:        ObjectInferenceResponse  — detected objects + watchlist flags
 * identity:       VerifyResponse | null    — face match result (null if no reference embedding)
 * voice_activity: VoiceActivityResponse | null  — speech detection (null if no audio)
 * violations:     list[str]                — e.g. ["no_face", "looking_away"]
 * severity_score: int                      — sum of violation point values
 * severity_level: str                      — NONE | LOW | MEDIUM | HIGH | CRITICAL
 * </pre>
 *
 * <h3>AI violation string values</h3>
 * <pre>
 *   "no_face"             → ViolationType.NO_FACE_DETECTED
 *   "multiple_faces"      → ViolationType.MULTIPLE_FACES_DETECTED
 *   "looking_away"        → ViolationType.LOOKING_AWAY
 *   "unauthorized_object" → ViolationType.UNAUTHORIZED_OBJECT
 *   "identity_mismatch"   → ViolationType.IDENTITY_MISMATCH
 * </pre>
 */
@Data
public class AnalyzeResponse {

    /** Face detection result — always present. */
    private FaceInferenceResult face;

    /** Gaze / head-pose result — always present. */
    private GazeResult gaze;

    /** Object detection result — always present. */
    private ObjectDetectionResult objects;

    /**
     * Identity verification result. {@code null} when no
     * {@code reference_embedding} was sent in the request (student not yet enrolled).
     */
    private IdentityResult identity;

    /**
     * Voice activity result. {@code null} when no {@code audio} chunk was sent.
     * Informational only — not factored into the severity score by the AI service.
     */
    @JsonProperty("voice_activity")
    private VoiceActivityResult voiceActivity;

    /**
     * List of violation string codes detected this frame.
     * Values: {@code "no_face"}, {@code "multiple_faces"}, {@code "looking_away"},
     * {@code "unauthorized_object"}, {@code "identity_mismatch"}.
     * Empty list means no violations.
     */
    private List<String> violations;

    /**
     * Aggregate severity score (sum of point values per violation).
     * 0 = clean frame.
     */
    @JsonProperty("severity_score")
    private int severityScore;

    /**
     * Human-readable severity band: {@code NONE}, {@code LOW}, {@code MEDIUM},
     * {@code HIGH}, or {@code CRITICAL}.
     */
    @JsonProperty("severity_level")
    private String severityLevel;
}
