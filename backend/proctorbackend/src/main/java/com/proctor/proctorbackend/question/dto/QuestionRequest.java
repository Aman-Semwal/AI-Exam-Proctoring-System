package com.proctor.proctorbackend.question.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

@Data
public class QuestionRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotEmpty(message = "Options are required")
    private Map<String, String> options;

    @NotBlank(message = "Correct option is required")
    private String correctOption;

    @NotNull(message = "Marks are required")
    @Min(value = 1, message = "Marks must be at least 1")
    private Integer marks;
}
