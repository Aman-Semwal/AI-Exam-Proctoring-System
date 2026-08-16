package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing an active or completed exam sitting by a student.
 *
 * <p>Tracks the full lifecycle of a student's attempt at an exam:
 * from {@code ACTIVE} (student is taking the exam) through {@code COMPLETED}
 * (student ended normally) or {@code TERMINATED} (system/admin force-ended).
 *
 * <p>{@code attemptNumber} increments each time the same student starts a new
 * session for the same exam (re-attempt logic). {@code score} is calculated
 * and stored when the session ends.
 */
@Entity
@Table(name = "exam_sessions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    /** Attempt number for this student on this exam (1 = first attempt). */
    @Column(nullable = false)
    private Integer attemptNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    /** Total score calculated when the session is completed. */
    private Integer score;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (attemptNumber == null) {
            attemptNumber = 1;
        }
    }
}
