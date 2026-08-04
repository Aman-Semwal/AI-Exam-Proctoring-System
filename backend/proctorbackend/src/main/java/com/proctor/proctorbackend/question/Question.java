package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.exam.Exam;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * JPA entity representing a multiple-choice question belonging to an exam.
 *
 * <p>The {@code options} field is persisted as a JSONB column in PostgreSQL,
 * storing option key-value pairs such as {@code {"A": "Paris", "B": "London"}}.
 * {@code correctOption} holds the key of the correct answer (e.g. {@code "A"}).
 */
@Entity
@Table(name = "questions")
@Data
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

    @Column(name = "question_text", nullable = false, length = 2000)
    private String questionText;

    /**
     * Multiple-choice options stored as JSON (e.g. {@code {"A":"Paris","B":"London"}}).
     * Persisted as JSONB in PostgreSQL for flexible querying.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, String> options;

    @Column(name = "correct_option", nullable = false)
    private String correctOption;

    @Column(nullable = false)
    private Integer marks;

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
