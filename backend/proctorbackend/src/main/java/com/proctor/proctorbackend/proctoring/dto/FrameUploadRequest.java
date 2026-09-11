package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class FrameUploadRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    /** Base64-encoded JPEG/PNG webcam frame (required). */
    @NotNull(message = "Frame data is required")
    private String frameBase64;

    /**
     * ArcFace 512-dim embedding captured at enrollment time.
     * Optional — when provided, the AI service performs identity verification
     * for this frame. The backend enforces that identity verification is
     * performed at least every {@code proctoring.identity.check-interval-frames}
     * frames regardless of whether the client sends this field.
     */
    @JsonProperty("reference_embedding")
    private List<Double> referenceEmbedding;
}
