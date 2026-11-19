package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.exam.Exam;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionExpiryProcessorTest {

    @Mock ExamSessionRepository sessionRepository;
    @Mock ScoreCalculationService scoreCalculationService;
    @InjectMocks SessionExpiryProcessor processor;

    private ExamSession session(LocalDateTime start) {
        Exam exam = Exam.builder().id(10L).durationMinutes(60).build();
        return ExamSession.builder().id(55L).exam(exam).status(SessionStatus.ACTIVE).startTime(start).build();
    }

    @Test
    void timeUp_submitsAsCompletedWithScore() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 5, 12, 0);
        ExamSession s = session(now.minusMinutes(61));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(s));
        when(scoreCalculationService.calculate(s)).thenReturn(12);

        processor.expireSession(55L, now);

        // Running out of time is a normal submission, not a cheating termination
        assertEquals(SessionStatus.COMPLETED, s.getStatus());
        assertEquals(12, s.getScore());
        assertEquals(now, s.getEndTime());
        verify(sessionRepository).save(s);
    }

    @Test
    void withinTime_leftActive() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 5, 12, 0);
        ExamSession s = session(now.minusMinutes(30));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(s));

        processor.expireSession(55L, now);

        assertEquals(SessionStatus.ACTIVE, s.getStatus());
        verify(sessionRepository, never()).save(any());
    }
}
