package com.proctor.proctorbackend.session.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SessionRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;
}
