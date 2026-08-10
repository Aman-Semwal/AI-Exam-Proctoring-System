package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.exam.Exam;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * JPA entity representing an exam question.
 *
 * <p>Supports multiple question types via {@link QuestionType}:
 * <ul>
 *   <li>MCQ       — {@code options} + {@code correctOption} required</li>
 *   <li>TRUE_FALSE — {@code correctOption} = "True"/"False", no options map needed</li>
 *   <li>FILL_BLANK — {@code correctOption} holds the expected answer text</li>
 *   <li>DESCRIPTIVE — no correctOption; evaluated manually or by AI</li>
 *   <li>CODING    — {@code metadata} holds testCases, language, starterCode etc.</li>
 * </ul>
 *
 * <p>{@code metadata} is a free-form JSONB column for type-specific extra data.
 */
@Entity
@Table(name = "questions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 20)
    private QuestionType questionType;

    @Column(name = "question_text", nullable = false, length = 2000)
    private String questionText;

    /**
     * MCQ options: e.g. {@code {"A":"Paris","B":"London","C":"Berlin","D":"Rome"}}.
     * Null for CODING, DESCRIPTIVE, FILL_BLANK, TRUE_FALSE.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> options;

    /**
     * For MCQ/TRUE_FALSE: key of the correct option (e.g. "A" or "True").
     * For FILL_BLANK: the expected answer string.
     * Null for DESCRIPTIVE and CODING (manually/AI graded).
     */
    @Column(name = "correct_option", length = 500)
    private String correctOption;

    /**
     * Type-specific extra data stored as JSONB.
     * Examples:
     * CODING     → {"language":"java","starterCode":"...","testCases":[{"input":"1","output":"1"}]}
     * DESCRIPTIVE→ {"maxWords":200,"rubric":"Explain in detail..."}
     * FILL_BLANK → {"caseSensitive":false,"keywords":["photosynthesis"]}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(nullable = false)
    private Integer marks;

    /**
     * Track this question belongs to — e.g. "SDE1", "SDE2", "DevOps", "COMMON".
     * Students only see questions matching their assigned track OR "COMMON" questions.
     */
    @Column(length = 100)
    @Builder.Default
    private String track = "COMMON";

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
