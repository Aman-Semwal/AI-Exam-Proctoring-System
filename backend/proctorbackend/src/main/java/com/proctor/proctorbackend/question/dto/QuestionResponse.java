package com.proctor.proctorbackend.question.dto;

import com.proctor.proctorbackend.question.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    private Long id;
    private Long examId;
    private QuestionType questionType;
    private String questionText;

    /** Null for CODING/DESCRIPTIVE. Hidden from students when includeAnswer=false. */
    private Map<String, String> options;

    /**
     * Correct answer — only returned when includeAnswer=true (admin/creator view).
     * Null for DESCRIPTIVE and CODING types.
     */
    private String correctOption;

    /**
     * Type-specific metadata (test cases for CODING, rubric for DESCRIPTIVE, etc.).
     * correctOption is stripped from metadata for student-facing responses.
     */
    private Map<String, Object> metadata;

    private Integer marks;
    private String track;
    private LocalDateTime createdAt;
}
