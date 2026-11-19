package com.proctor.proctorbackend.violation.dto;

import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ViolationRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotNull(message = "Violation type is required")
    private ViolationType type;

    @NotNull(message = "Severity is required")
    private ViolationSeverity severity;

    private String details;
}
