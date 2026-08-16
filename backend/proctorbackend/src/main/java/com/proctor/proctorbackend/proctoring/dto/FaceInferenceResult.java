package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class FaceInferenceResult {

    @JsonProperty("faces_detected")
    private int faceCount;

    @JsonProperty("faces")
    private List<FaceBox> faces;

    @Data
    public static class FaceBox {
        private int x;
        private int y;
        private int width;
        private int height;
        private double confidence;
    }
}
