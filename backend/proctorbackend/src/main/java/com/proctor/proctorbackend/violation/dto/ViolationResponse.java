package com.proctor.proctorbackend.violation.dto;

import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationResponse {

    private Long id;
    private Long sessionId;
    private ViolationType type;
    private ViolationSeverity severity;
    private String details;
    private Boolean reviewed;
    private LocalDateTime createdAt;
}
