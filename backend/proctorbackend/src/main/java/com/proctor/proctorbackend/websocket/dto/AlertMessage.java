package com.proctor.proctorbackend.websocket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertMessage {

    private Long sessionId;
    private String studentName;
    private String eventType;
    private String details;
    /** LOW / MEDIUM / HIGH / CRITICAL — the severity the backend recorded. */
    private String severity;
    private String examTitle;
    /** The recorded violation behind this alert, so the proctor can review it directly. */
    private Long violationId;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now(java.time.ZoneOffset.UTC);
}
