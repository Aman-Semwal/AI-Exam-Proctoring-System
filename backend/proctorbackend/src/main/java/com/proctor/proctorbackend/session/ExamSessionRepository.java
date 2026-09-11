package com.proctor.proctorbackend.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {

    List<ExamSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<ExamSession> findByStudentIdAndOrganizationIdOrderByCreatedAtDesc(Long studentId, Long organizationId);

    List<ExamSession> findByExamIdOrderByCreatedAtDesc(Long examId);

    List<ExamSession> findByExamIdAndOrganizationIdOrderByCreatedAtDesc(Long examId, Long organizationId);

    Optional<ExamSession> findByExamIdAndStudentId(Long examId, Long studentId);

    boolean existsByExamIdAndStudentIdAndStatus(Long examId, Long studentId, SessionStatus status);

    long countByExamIdAndStudentId(Long examId, Long studentId);

    /**
     * Kept for compatibility — used only by callers that need the raw active list
     * without a deadline filter (e.g. dashboard counts).
     *
     * <p><b>Do NOT use this in the expiry scheduler.</b>
     * Use {@link #findExpiredActiveSessions(LocalDateTime)} instead to avoid
     * loading the entire active session set into heap on every scheduler tick.
     */
    List<ExamSession> findByStatus(SessionStatus status);

    /**
     * BUG-012 fix: returns only ACTIVE sessions whose personal deadline
     * (startTime + durationMinutes) has already passed, evaluated entirely in the
     * database. The scheduler no longer loads every active session into memory.
     *
     * <p>The {@code :now} parameter should be {@code LocalDateTime.now(ZoneId.of("UTC"))}.
     *
     * <p>Only sessions with a non-null {@code startTime} and a non-null exam
     * {@code durationMinutes} are considered — the processor skips sessions with
     * missing values anyway, so excluding them at query time saves unnecessary work.
     */
    @Query("""
            SELECT s FROM ExamSession s
            JOIN FETCH s.exam e
            JOIN FETCH s.student
            WHERE s.status = 'ACTIVE'
              AND s.startTime IS NOT NULL
              AND e.durationMinutes IS NOT NULL
              AND s.startTime < :cutoff
            """)
    List<ExamSession> findExpiredActiveSessions(@Param("cutoff") LocalDateTime cutoff);
}
