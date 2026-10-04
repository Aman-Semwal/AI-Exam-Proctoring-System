package com.proctor.proctorbackend.session.dto;

import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.violation.ReviewOutcome;
import com.proctor.proctorbackend.violation.TrustLevel;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/** Evidence-backed integrity report for one exam session. */
@Data
@Builder
public class SessionReportResponse {

    private Long sessionId;
    private Integer attemptNumber;
    private SessionStatus status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long durationMinutes;

    private String studentName;
    private String studentEmail;
    private Long examId;
    private String examTitle;
    private Integer score;

    private Integer trustScore;
    private TrustLevel trustLevel;

    private Map<String, Long> countsByType;
    private Map<String, Long> countsBySeverity;
    /** Every violation, oldest first. */
    private List<Entry> timeline;

    @Data
    @Builder
    public static class Entry {
        private Long violationId;
        private LocalDateTime time;
        private ViolationType type;
        private ViolationSeverity severity;
        private String details;
        private ReviewOutcome reviewOutcome;
        private boolean hasEvidence;
    }
}
