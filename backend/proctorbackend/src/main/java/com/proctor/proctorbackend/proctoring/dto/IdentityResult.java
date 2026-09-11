package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Mirrors Python {@code VerifyResponse} from {@code app/models/identity.py}.
 *
 * <p>Present in {@link AnalyzeResponse#identity} only when
 * {@code reference_embedding} was included in the request.
 * {@code null} otherwise (student has no enrolled embedding yet).
 *
 * <pre>
 * face_detected: bool
 * match:         bool
 * similarity:    float | None   (cosine similarity in [-1, 1]; null if no face found)
 * </pre>
 */
@Data
public class IdentityResult {

    @JsonProperty("face_detected")
    private boolean faceDetected;

    private boolean match;

    /** Cosine similarity [-1, 1]. {@code null} when no face was detected in the current frame. */
    private Double similarity;
}
