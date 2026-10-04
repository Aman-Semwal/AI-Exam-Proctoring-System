package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Response from {@code POST /infer/identity/embed}.
 * {@code embedding} is a 512-dim ArcFace vector, or {@code null} when no face was found.
 */
@Data
public class EmbedResult {

    @JsonProperty("face_detected")
    private boolean faceDetected;

    private List<Double> embedding;
}
