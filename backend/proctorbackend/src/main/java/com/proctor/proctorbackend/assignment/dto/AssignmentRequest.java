package com.proctor.proctorbackend.assignment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AssignmentRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotNull(message = "Student ID is required")
    private Long studentId;
}
