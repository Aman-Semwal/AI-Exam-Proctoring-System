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

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
