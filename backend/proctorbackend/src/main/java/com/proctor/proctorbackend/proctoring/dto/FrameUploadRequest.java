package com.proctor.proctorbackend.proctoring.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FrameUploadRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    /** Base64-encoded JPEG/PNG webcam frame (required). */
    @NotNull(message = "Frame data is required")
    @Size(max = 2_000_000, message = "Frame is too large")
    private String frameBase64;

    /** Optional 16-bit PCM mono 16 kHz WAV (base64) covering the last frame interval. */
    @Size(max = 1_000_000, message = "Audio chunk is too large")
    private String audioBase64;
}
