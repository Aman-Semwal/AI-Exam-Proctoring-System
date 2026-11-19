package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.session.ExamSession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * JPA entity representing a student's answer to a single question within an exam session.
 *
 * <p>{@code isCorrect} is computed at submission time by comparing {@code selectedOption}
 * with {@link Question#getCorrectOption()} and persisted to allow fast score calculation.
 *
 * <h3>BUG-004 fix</h3>
 * {@code answeredAt} is now updated on every write (INSERT and UPDATE) via both
 * {@link PrePersist} and {@link PreUpdate} lifecycle hooks. Previously only
 * {@link PrePersist} was present, so re-submitting an answer (the upsert path in
 * {@code AnswerServiceImpl}) left {@code answeredAt} frozen at the original submission
 * time, breaking the "latest answer wins" deduplication logic in {@code getExamResult}.
 *
 * <p>All timestamps use {@code ZoneId.of("UTC")} for consistency with the service layer.
 */
@Entity
@Table(
    name = "answers",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_session_question",
        columnNames = {"session_id", "question_id"}
    )
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "selected_option")
    private String selectedOption;

    /**
     * Text-based answer for CODING, DESCRIPTIVE, FILL_BLANK question types.
     * Stored as TEXT to accommodate large code submissions.
     */
    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    /** Timestamp of the most recent submission of this answer. Updated on every write. */
    private LocalDateTime answeredAt;

    /** Sets answeredAt on initial INSERT. */
    @PrePersist
    protected void onCreate() {
        answeredAt = LocalDateTime.now(ZoneId.of("UTC"));
    }

    /**
     * Updates answeredAt on every UPDATE (re-submission / grading).
     *
     * <p>Without this, the upsert path in {@code AnswerServiceImpl.submitAnswer} leaves
     * {@code answeredAt} frozen at the original submission time. The "latest answer wins"
     * deduplication in {@code SessionServiceImpl.getExamResult} then silently picks the
     * wrong answer when both share the same timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        answeredAt = LocalDateTime.now(ZoneId.of("UTC"));
    }
}
