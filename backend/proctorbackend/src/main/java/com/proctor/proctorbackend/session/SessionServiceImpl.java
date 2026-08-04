package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.session.dto.SessionRequest;
import com.proctor.proctorbackend.session.dto.SessionResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Concrete implementation of {@link SessionService}.
 *
 * <p>Manages the full lifecycle of an {@link ExamSession}:
 * starting, ending, and querying sessions. All write operations are
 * wrapped in transactions to guarantee consistency.
 */
@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final SessionRepository sessionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;

    /**
     * Starts a new exam session for a student.
     *
     * <p>Prevents duplicate active sessions: if the student already has an
     * {@code ACTIVE} session for the same exam, a {@link BadRequestException} is thrown.
     * The {@code attemptNumber} is derived by counting the student's prior sessions for this exam.
     */
    @Override
    @Transactional
    public SessionResponse startSession(SessionRequest request, String studentEmail) {
        User student = getUserByEmail(studentEmail);
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));

        boolean alreadyActive = sessionRepository.existsByExamIdAndStudentIdAndStatus(
                exam.getId(), student.getId(), SessionStatus.ACTIVE);
        if (alreadyActive) {
            throw new BadRequestException("An active session already exists for this exam");
        }

        long priorAttempts = sessionRepository.countByExamIdAndStudentId(exam.getId(), student.getId());

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .student(student)
                .status(SessionStatus.ACTIVE)
                .attemptNumber((int) priorAttempts + 1)
                .startTime(LocalDateTime.now())
                .build();

        return toResponse(sessionRepository.save(session));
    }

    /**
     * Ends an active exam session by marking it {@code COMPLETED}, recording the end time,
     * and computing the score from submitted answers.
     */
    @Override
    @Transactional
    public SessionResponse endSession(Long sessionId, String studentEmail) {
        ExamSession session = findSessionById(sessionId);
        User student = getUserByEmail(studentEmail);

        if (!session.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedException("You are not authorized to end this session");
        }

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }

        // Calculate score: sum marks of correctly answered questions
        int score = calculateScore(session);

        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(LocalDateTime.now());
        session.setScore(score);
        return toResponse(sessionRepository.save(session));
    }

    @Override
    public SessionResponse getSessionById(Long sessionId) {
        return toResponse(findSessionById(sessionId));
    }

    @Override
    public List<SessionResponse> getMySessionsAsStudent(String studentEmail) {
        User student = getUserByEmail(studentEmail);
        return sessionRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<SessionResponse> getSessionsByExam(Long examId, String examinerEmail) {
        return sessionRepository.findByExamIdOrderByCreatedAtDesc(examId)
                .stream().map(this::toResponse).toList();
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private int calculateScore(ExamSession session) {
        return session.getExam().getId() != null
                ? questionRepository.findByExamId(session.getExam().getId()).stream()
                        .filter(q -> {
                            var answer = answerRepository
                                    .findBySessionIdAndQuestionId(session.getId(), q.getId());
                            return answer.map(a -> Boolean.TRUE.equals(a.getIsCorrect())).orElse(false);
                        })
                        .mapToInt(q -> q.getMarks())
                        .sum()
                : 0;
    }

    private ExamSession findSessionById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private SessionResponse toResponse(ExamSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .studentId(session.getStudent().getId())
                .studentName(session.getStudent().getName())
                .attemptNumber(session.getAttemptNumber())
                .status(session.getStatus())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .score(session.getScore())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
