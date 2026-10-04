package com.proctor.proctorbackend.session.dto;

import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.violation.TrustLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionResponse {

    private Long id;
    private Long examId;
    private String examTitle;
    private Long studentId;
    private String studentName;
    private Long orgId;
    private String orgSlug;
    private Integer attemptNumber;
    private SessionStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer score;
    private LocalDateTime createdAt;

    /** Whether the pre-exam reference photo has been enrolled (the embedding itself is never exposed). */
    private boolean referenceEnrolled;

    /** 0–100, computed from non-dismissed violations (see TrustScoreService). */
    private Integer trustScore;
    private TrustLevel trustLevel;
}
