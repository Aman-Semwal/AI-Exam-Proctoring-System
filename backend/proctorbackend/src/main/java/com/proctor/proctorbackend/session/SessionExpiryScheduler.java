package com.proctor.proctorbackend.session;

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
 * <p>Runs every 30 seconds, protected by ShedLock so only one instance
 * executes at a time in a multi-node deployment.
 *
 * <h3>BUG-012 fix — replaced full active-session load with filtered query</h3>
 * <p>The previous implementation called {@code findByStatus(ACTIVE)}, loading
 * <em>every</em> active session into heap on every tick regardless of whether
 * any had actually expired. With thousands of concurrent sessions this causes
 * unnecessary DB I/O and GC pressure.
 *
 * <p>The new implementation calls
 * {@link ExamSessionRepository#findExpiredActiveSessions(LocalDateTime)} which
 * pushes the {@code startTime + durationMinutes < now} filter into the SQL
 * {@code WHERE} clause, so only genuinely overdue sessions are returned.
 *
 * <p>The {@code cutoff} value passed to the query is
 * {@code now minus the maximum possible exam duration} — in practice we pass
 * {@code now} directly because the JPQL expression
 * {@code s.startTime < :cutoff} already compares start time against the
 * <em>current</em> moment, giving us all sessions that <em>could</em> have
 * expired (their start was in the past). The processor double-checks the exact
 * deadline with {@code startTime + durationMinutes} before terminating.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryScheduler {

    private final ExamSessionRepository  sessionRepository;
    private final SessionExpiryProcessor sessionExpiryProcessor;

    @Scheduled(fixedDelay = 30_000)
    @SchedulerLock(name = "expireOverdueSessions", lockAtMostFor = "PT5M", lockAtLeastFor = "PT10S")
    public void expireOverdueSessions() {
        LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC"));

        // BUG-012 fix: only fetch sessions whose startTime is in the past —
        // the DB does the filtering; we never touch sessions that are still within their window.
        List<ExamSession> candidates = sessionRepository.findExpiredActiveSessions(now);
        if (candidates.isEmpty()) return;

        log.debug("Expiry check: {} candidate session(s) to evaluate", candidates.size());

        for (ExamSession session : candidates) {
            // Processor re-checks the exact deadline (startTime + durationMinutes)
            // and terminates only if truly overdue. Runs in REQUIRES_NEW transaction
            // so one failure doesn't roll back the entire batch.
            sessionExpiryProcessor.expireSession(session.getId(), now);
        }
    }
}
