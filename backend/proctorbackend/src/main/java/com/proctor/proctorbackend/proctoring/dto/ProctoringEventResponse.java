package com.proctor.proctorbackend.proctoring.dto;

import com.proctor.proctorbackend.proctoring.ProctoringEvent;
import com.proctor.proctorbackend.session.SessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctoringEventResponse {

    private Long id;
    private Long sessionId;
    private ProctoringEvent.EventType eventType;
    private String details;
    private Integer faceCount;
    private LocalDateTime detectedAt;

    /** AI violation strings recorded for this frame (empty for a clean frame). */
    @Builder.Default
    private List<String> violationsDetected = List.of();

    /** Session status after this frame — TERMINATED if it triggered an auto-terminate. */
    private SessionStatus sessionStatus;
}
