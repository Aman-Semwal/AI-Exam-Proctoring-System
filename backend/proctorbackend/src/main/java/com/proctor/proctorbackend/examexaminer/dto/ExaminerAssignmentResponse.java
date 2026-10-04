package com.proctor.proctorbackend.examexaminer.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data
@Builder
public class ExaminerAssignmentResponse {
    private Long id;
    private Long examId;
    private Long examinerId;
    private String examinerName;
    private String examinerEmail;
    private Instant assignedAt;
}
