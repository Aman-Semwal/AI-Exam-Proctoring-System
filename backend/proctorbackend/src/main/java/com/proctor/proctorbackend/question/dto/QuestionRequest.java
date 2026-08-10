package com.proctor.proctorbackend.question.dto;

import com.proctor.proctorbackend.question.QuestionType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

/**
 * Request DTO for creating or updating a question.
 *
 * <p>Field requirements per question type:
 * <pre>
 * MCQ         → options (required, ≥2 keys), correctOption (required, must be a key in options)
 * TRUE_FALSE  → correctOption = "True" or "False" (options auto-generated, no need to send)
 * FILL_BLANK  → correctOption = expected answer text
 * DESCRIPTIVE → options and correctOption both null; metadata may carry rubric/maxWords
 * CODING      → options and correctOption both null; metadata carries language, starterCode,
 *               testCases list, etc.
 * </pre>
 *
 * <p>Type-based validation is enforced in {@code QuestionServiceImpl}.
 */
@Data
public class QuestionRequest {

    @NotNull(message = "Exam ID is required")
    private Long examId;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotBlank(message = "Question text is required")
    private String questionText;

    /**
     * Required for MCQ only.
     * Map of option key → option text, e.g. {"A":"Paris","B":"London","C":"Berlin","D":"Rome"}.
     */
    private Map<String, String> options;

    /**
     * Required for MCQ, TRUE_FALSE, FILL_BLANK.
     * For MCQ: must match one of the keys in {@code options}.
     * For TRUE_FALSE: must be "True" or "False".
     * For FILL_BLANK: the expected answer text.
     */
    private String correctOption;

    /**
     * Optional extra data per question type.
     * CODING example:
     * {
     *   "language": "java",
     *   "starterCode": "public class Solution { }",
     *   "testCases": [{"input": "5", "expectedOutput": "120"}]
     * }
     * DESCRIPTIVE example:
     * {
     *   "maxWords": 200,
     *   "rubric": "Mention at least 3 key points."
     * }
     */
    private Map<String, Object> metadata;

    @NotNull(message = "Marks are required")
    @Min(value = 1, message = "Marks must be at least 1")
    private Integer marks;

    /**
     * Track this question belongs to — e.g. "SDE1", "SDE2", "DevOps", "COMMON".
     * Defaults to "COMMON" if not provided (visible to all tracks).
     */
    private String track;
}
