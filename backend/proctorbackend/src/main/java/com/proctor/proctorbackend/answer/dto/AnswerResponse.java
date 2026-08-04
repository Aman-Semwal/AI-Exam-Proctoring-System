package com.proctor.proctorbackend.answer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {

    private Long id;
    private Long sessionId;
    private Long questionId;
    private String questionText;
    private String selectedOption;
    private Boolean isCorrect;
    private LocalDateTime answeredAt;
}
