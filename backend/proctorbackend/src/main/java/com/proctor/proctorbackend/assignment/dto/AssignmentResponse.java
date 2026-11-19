package com.proctor.proctorbackend.assignment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentResponse {

    private Long id;
    private Long examId;
    private String examTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long orgId;
    private String orgSlug;
    private String track;
    private LocalDateTime assignedAt;
}
