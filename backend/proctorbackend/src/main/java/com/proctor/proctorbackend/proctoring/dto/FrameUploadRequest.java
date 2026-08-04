package com.proctor.proctorbackend.proctoring.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FrameUploadRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    // Base64-encoded image frame from the webcam
    @NotNull(message = "Frame data is required")
    private String frameBase64;
}
