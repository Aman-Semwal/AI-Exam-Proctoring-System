package com.proctor.proctorbackend.proctoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ReferencePhotoRequest {

    /** Base64-encoded JPEG/PNG live photo taken before the exam (no data-URI prefix). */
    @NotBlank(message = "Image data is required")
    @Size(max = 2_000_000, message = "Photo is too large")
    private String imageBase64;
}
