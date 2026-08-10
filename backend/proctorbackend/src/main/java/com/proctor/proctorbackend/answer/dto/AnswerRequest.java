package com.proctor.proctorbackend.answer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnswerRequest {

    @NotNull(message = "Session ID is required")
    private Long sessionId;

    @NotNull(message = "Question ID is required")
    private Long questionId;

    /** For MCQ / TRUE_FALSE */
    private String selectedOption;

    /** For CODING / DESCRIPTIVE / FILL_BLANK */
    private String textAnswer;
}
