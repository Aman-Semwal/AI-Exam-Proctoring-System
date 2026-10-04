package com.proctor.proctorbackend.violation;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TrustScoreServiceTest {

    @Mock ViolationRepository violationRepository;
    @InjectMocks TrustScoreService service;

    private Violation v(ViolationSeverity severity, ReviewOutcome outcome) {
        return Violation.builder().severity(severity).reviewOutcome(outcome).reviewed(outcome != null).build();
    }

    @Test
    void noViolations_isFullyTrusted() {
        when(violationRepository.findBySessionId(1L)).thenReturn(Collections.emptyList());

        TrustScore score = service.calculate(1L);

        assertEquals(100, score.score());
        assertEquals(TrustLevel.TRUSTED, score.level());
    }

    @Test
    void penaltiesBySeverity_LOW2_MEDIUM5_HIGH10_CRITICAL20() {
        when(violationRepository.findBySessionId(1L)).thenReturn(List.of(
                v(ViolationSeverity.LOW, null),
                v(ViolationSeverity.MEDIUM, null),
                v(ViolationSeverity.HIGH, null),
                v(ViolationSeverity.CRITICAL, null)));

        TrustScore score = service.calculate(1L);

        assertEquals(63, score.score()); // 100 - (2 + 5 + 10 + 20)
        assertEquals(TrustLevel.REVIEW, score.level());
    }

    @Test
    void dismissedViolationsDoNotCount_confirmedDo() {
        when(violationRepository.findBySessionId(1L)).thenReturn(List.of(
                v(ViolationSeverity.CRITICAL, ReviewOutcome.DISMISSED),
                v(ViolationSeverity.CRITICAL, ReviewOutcome.CONFIRMED)));

        assertEquals(80, service.calculate(1L).score());
    }

    @Test
    void neverBelowZero_andSuspiciousBelow50() {
        when(violationRepository.findBySessionId(1L)).thenReturn(Collections.nCopies(8, v(ViolationSeverity.CRITICAL, null)));

        TrustScore score = service.calculate(1L);

        assertEquals(0, score.score());
        assertEquals(TrustLevel.SUSPICIOUS, score.level());
    }

    @Test
    void levelBoundaries() {
        assertEquals(TrustLevel.TRUSTED, TrustLevel.of(80));
        assertEquals(TrustLevel.REVIEW, TrustLevel.of(79));
        assertEquals(TrustLevel.REVIEW, TrustLevel.of(50));
        assertEquals(TrustLevel.SUSPICIOUS, TrustLevel.of(49));
    }
}
