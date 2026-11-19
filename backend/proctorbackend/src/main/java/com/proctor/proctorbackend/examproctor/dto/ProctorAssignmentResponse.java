package com.proctor.proctorbackend.examproctor.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctorAssignmentResponse {
    private Long id;
    private Long examId;
    private String examTitle;
    private Long examinerId;
    private String examinerName;
    private String examinerEmail;
    private Long orgId;
    private LocalDateTime assignedAt;
}
