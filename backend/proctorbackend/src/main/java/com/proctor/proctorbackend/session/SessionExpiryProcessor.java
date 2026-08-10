package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SessionExpiryProcessor {

    private final ExamSessionRepository sessionRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final ExamAssignmentRepository assignmentRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void expireSession(Long sessionId, LocalDateTime now) {
        ExamSession session = sessionRepository.findById(sessionId).orElse(null);
        if (session == null || session.getStatus() != SessionStatus.ACTIVE) {
            return;
        }
        if (session.getStartTime() == null || session.getExam() == null || session.getExam().getDurationMinutes() == null) {
            log.warn("Skipping session expiry for {} due to missing values", sessionId);
            return;
        }

        LocalDateTime deadline = session.getStartTime().plusMinutes(session.getExam().getDurationMinutes());
        if (now.isAfter(deadline)) {
            session.setScore(calculateScore(session));
            session.setStatus(SessionStatus.TERMINATED);
            session.setEndTime(now);
            sessionRepository.save(session);
        }
    }

    private int calculateScore(ExamSession session) {
        List<String> tracks = assignmentRepository
                .findByExamIdAndStudentId(session.getExam().getId(), session.getStudent().getId())
                .map(a -> a.getTrack() != null ? List.of(a.getTrack(), "COMMON") : List.of("COMMON"))
                .orElse(List.of("COMMON"));
        return questionRepository.findByExamIdAndTrackIn(session.getExam().getId(), tracks).stream()
                .filter(q -> answerRepository.findBySessionIdAndQuestionId(session.getId(), q.getId())
                        .map(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                        .orElse(false))
                .mapToInt(Question::getMarks)
                .sum();
    }
}
