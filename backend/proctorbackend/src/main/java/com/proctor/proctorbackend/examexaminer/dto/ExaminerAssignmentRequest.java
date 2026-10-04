package com.proctor.proctorbackend.examexaminer.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class ExaminerAssignmentRequest {
    @NotNull(message = "Examiner ID is required")
    private Long examinerId;
}
