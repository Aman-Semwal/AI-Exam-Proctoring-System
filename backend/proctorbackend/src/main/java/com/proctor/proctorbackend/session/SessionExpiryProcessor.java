package com.proctor.proctorbackend.session;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Per-session expiry processor called by {@link SessionExpiryScheduler}.
 *
 * <p>Runs in its own transaction ({@code REQUIRES_NEW}) so that a failure on
 * one session does not roll back the entire scheduler batch.
 *
 * <p>Score is now calculated via {@link ScoreCalculationService} (track-aware),
 * consistent with {@code SessionServiceImpl.endSession} and
 * {@code ProctoringServiceImpl}'s auto-terminate path.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryProcessor {

    private final ExamSessionRepository  sessionRepository;
    private final ScoreCalculationService scoreCalculationService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireSession(Long sessionId, LocalDateTime now) {
        ExamSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || session.getStatus() != SessionStatus.ACTIVE) {
            return;
        }
        if (session.getStartTime() == null
                || session.getExam() == null
                || session.getExam().getDurationMinutes() == null) {
            log.warn("Skipping session expiry for {} due to missing values", sessionId);
            return;
        }

        LocalDateTime deadline = session.getStartTime()
                .plusMinutes(session.getExam().getDurationMinutes());
        if (now.isAfter(deadline)) {
            session.setScore(scoreCalculationService.calculate(session));
            session.setStatus(SessionStatus.TERMINATED);
            session.setEndTime(now);
            sessionRepository.save(session);
        }
    }
}
