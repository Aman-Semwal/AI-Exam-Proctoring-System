package com.proctor.proctorbackend.proctoring.dto;

import com.proctor.proctorbackend.proctoring.ProctoringEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
}
