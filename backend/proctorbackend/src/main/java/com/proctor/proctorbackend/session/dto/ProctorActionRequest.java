package com.proctor.proctorbackend.session.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Reason for a termination, or the text of a warning shown to the student. */
@Data
public class ProctorActionRequest {

    @NotBlank(message = "A message is required")
    @Size(max = 300, message = "Keep it under 300 characters")
    private String message;
}
