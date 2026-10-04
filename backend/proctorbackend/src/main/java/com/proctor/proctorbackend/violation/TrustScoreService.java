package com.proctor.proctorbackend.violation;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Trust score = 100 minus a penalty per violation that a reviewer has not dismissed.
 *
 * <p>Computed on read rather than stored, so dismissing a false positive later
 * updates the score immediately and there is no stored value to go stale.
 */
@Service
@RequiredArgsConstructor
public class TrustScoreService {

    private final ViolationRepository violationRepository;

    @Transactional(readOnly = true)
    public TrustScore calculate(Long sessionId) {
        int penalty = violationRepository.findBySessionId(sessionId).stream()
                .filter(v -> v.getReviewOutcome() != ReviewOutcome.DISMISSED)
                .mapToInt(v -> penaltyFor(v.getSeverity()))
                .sum();
        int score = Math.max(0, 100 - penalty);
        return new TrustScore(score, TrustLevel.of(score));
    }

    private static int penaltyFor(ViolationSeverity severity) {
        if (severity == null) return 0;
        return switch (severity) {
            case LOW      -> 2;
            case MEDIUM   -> 5;
            case HIGH     -> 10;
            case CRITICAL -> 20;
        };
    }
}
