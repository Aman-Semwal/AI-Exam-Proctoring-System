package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.SessionExpiryProcessor;
import com.proctor.proctorbackend.session.SessionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

/**
 * Scheduled job that auto-expires ACTIVE exam sessions once the student's
 * personal deadline (startTime + durationMinutes) has passed.
 *
 * Runs every 30 seconds. For each expired session:
 *  - status → TERMINATED
 *  - endTime → now
 *  - score   → calculated from whatever answers were submitted
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryScheduler {

    private final ExamSessionRepository sessionRepository;
    private final SessionExpiryProcessor sessionExpiryProcessor;

    @Scheduled(fixedDelay = 30_000)
    @SchedulerLock(name = "expireOverdueSessions", lockAtMostFor = "PT5M", lockAtLeastFor = "PT10S")
    public void expireOverdueSessions() {
        List<ExamSession> activeSessions = sessionRepository.findByStatus(SessionStatus.ACTIVE);
        if (activeSessions.isEmpty()) return;

        LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC"));

        for (ExamSession session : activeSessions) {
            if (session.getStartTime() == null || session.getExam() == null || session.getExam().getDurationMinutes() == null) {
                log.warn("Skipping session {} due to missing values: startTime={}, durationMinutes={}",
                        session.getId(), session.getStartTime(),
                        session.getExam() != null ? session.getExam().getDurationMinutes() : null);
                continue;
            }
            LocalDateTime deadline = session.getStartTime().plusMinutes(session.getExam().getDurationMinutes());
            if (now.isAfter(deadline)) {
                sessionExpiryProcessor.expireSession(session.getId(), now);
                log.info("Auto-terminated session {} (deadline: {})",
                        session.getId(), deadline);
            }
        }
    }
}
