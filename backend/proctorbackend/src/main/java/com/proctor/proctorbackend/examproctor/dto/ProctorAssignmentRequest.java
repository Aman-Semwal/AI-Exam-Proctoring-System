package com.proctor.proctorbackend.examproctor.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class ProctorAssignmentRequest {
    @NotNull
    private Long examinerId;
}
