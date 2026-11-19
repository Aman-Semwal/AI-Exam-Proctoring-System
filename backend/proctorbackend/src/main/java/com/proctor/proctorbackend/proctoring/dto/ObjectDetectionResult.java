package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Mirrors Python {@code ObjectInferenceResponse} from {@code app/models/object.py}.
 *
 * <pre>
 * objects:              list[DetectedObject]
 * unauthorized_objects: list[DetectedObject]   (watchlist subset: phone, book, remote)
 * flagged:              bool
 *
 * DetectedObject: { label, confidence, x, y, width, height }
 * </pre>
 */
@Data
public class ObjectDetectionResult {

    private List<DetectedObject> objects;

    @JsonProperty("unauthorized_objects")
    private List<DetectedObject> unauthorizedObjects;

    private boolean flagged;

    @Data
    public static class DetectedObject {
        private String label;
        private double confidence;
        private int x;
        private int y;
        private int width;
        private int height;
    }
}
