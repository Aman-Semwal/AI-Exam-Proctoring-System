package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.Answer;
import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.session.dto.ExamResultResponse;
import com.proctor.proctorbackend.session.dto.SessionRequest;
import com.proctor.proctorbackend.session.dto.SessionResponse;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;

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

    private final ExamSessionRepository sessionRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;
    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final ExamProctorService examProctorService;
    private final ViolationRepository violationRepository;

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
        validateSameOrganization(student, exam);

        // Verify the student is assigned to this exam
        if (!assignmentRepository.existsByExamIdAndStudentId(exam.getId(), student.getId())) {
            throw new com.proctor.proctorbackend.common.exception.UnauthorizedException(
                    "You are not assigned to this exam");
        }

        LocalDateTime now = LocalDateTime.now(ZoneId.of("UTC"));
        if (exam.getStartTime() != null && now.isBefore(exam.getStartTime())) {
            throw new BadRequestException("Exam has not started yet");
        }
        if (exam.getEndTime() != null && now.isAfter(exam.getEndTime())) {
            throw new BadRequestException("Exam window has already closed");
        }

        boolean alreadyActive = sessionRepository.existsByExamIdAndStudentIdAndStatus(
                exam.getId(), student.getId(), SessionStatus.ACTIVE);
        if (alreadyActive) {
            throw new BadRequestException("An active session already exists for this exam");
        }

        long priorAttempts = sessionRepository.countByExamIdAndStudentId(exam.getId(), student.getId());

        ExamSession session = ExamSession.builder()
                .exam(exam)
                .student(student)
                .organization(exam.getOrganization())
                .status(SessionStatus.ACTIVE)
                .attemptNumber((int) priorAttempts + 1)
                .startTime(LocalDateTime.now(ZoneId.of("UTC")))
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
        User student = getUserByEmail(studentEmail);
        ExamSession session = findSessionById(sessionId);
        validateSameOrganization(student, session);

        if (!session.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedException("You are not authorized to end this session");
        }

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Session is not active");
        }

        // Calculate score: sum marks of correctly answered questions filtered by student's track
        int score = calculateScore(session);

        session.setStatus(SessionStatus.COMPLETED);
        session.setEndTime(LocalDateTime.now(ZoneId.of("UTC")));
        session.setScore(score);
        return toResponse(sessionRepository.save(session));
    }

    @Override
    public SessionResponse getSessionById(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = findSessionById(sessionId);
        validateSameOrganization(requester, session);
        if (requester.getRole() == Role.STUDENT && !session.getStudent().getId().equals(requester.getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        return toResponse(session);
    }

    @Override
    public List<SessionResponse> getMySessionsAsStudent(String studentEmail) {
        User student = getUserByEmail(studentEmail);
        if (student.getRole() == Role.SUPER_ADMIN) {
            return sessionRepository.findByStudentIdOrderByCreatedAtDesc(student.getId())
                    .stream().map(this::toResponse).toList();
        }
        return sessionRepository.findByStudentIdAndOrganizationIdOrderByCreatedAtDesc(
                        student.getId(), student.getOrganization().getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<SessionResponse> getSessionsByExam(Long examId, String examinerEmail) {
        User requester = getUserByEmail(examinerEmail);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        validateSameOrganization(requester, exam);

        if (requester.getRole() == Role.SUPER_ADMIN) {
            return sessionRepository.findByExamIdOrderByCreatedAtDesc(examId)
                    .stream().map(this::toResponse).toList();
        }
        if (requester.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(requester.getId(), examId)) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
        return sessionRepository.findByExamIdAndOrganizationIdOrderByCreatedAtDesc(
                        examId, requester.getOrganization().getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public SessionResponse recalculateScore(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = findSessionById(sessionId);
        validateSameOrganization(requester, session);
        session.setScore(calculateScore(session));
        return toResponse(sessionRepository.save(session));
    }

    @Override
    public ExamResultResponse getExamResult(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = findSessionById(sessionId);
        validateSameOrganization(requester, session);
        if (requester.getRole() != Role.SUPER_ADMIN
                && requester.getRole() != Role.ORG_ADMIN
                && requester.getRole() != Role.EXAM_CREATOR) {
            throw new UnauthorizedException("You are not authorized to view this result");
        }

        List<Question> questions = questionRepository.findByExamId(session.getExam().getId());
        Map<Long, Answer> answerMap = answerRepository.findBySessionId(sessionId).stream()
                .collect(Collectors.toMap(
                        a -> a.getQuestion().getId(),
                        Function.identity(),
                        (existing, replacement) -> {
                            if (existing.getAnsweredAt() == null) {
                                return replacement;
                            }
                            if (replacement.getAnsweredAt() == null) {
                                return existing;
                            }
                            return replacement.getAnsweredAt().isAfter(existing.getAnsweredAt()) ? replacement : existing;
                        },
                        LinkedHashMap::new));

        int totalMarks = questions.stream().mapToInt(Question::getMarks).sum();
        int correct    = 0, incorrect = 0, pendingReview = 0, unattempted = 0;

        List<ExamResultResponse.QuestionResultDetail> breakdown = new java.util.ArrayList<>();
        for (Question q : questions) {
            Answer a = answerMap.get(q.getId());
            if (a == null) {
                unattempted++;
            } else if (a.getIsCorrect() == null) {
                pendingReview++;
            } else if (Boolean.TRUE.equals(a.getIsCorrect())) {
                correct++;
            } else if (Boolean.FALSE.equals(a.getIsCorrect())) {
                incorrect++;
            }
            breakdown.add(ExamResultResponse.QuestionResultDetail.builder()
                    .questionId(q.getId())
                    .questionText(q.getQuestionText())
                    .questionType(q.getQuestionType().name())
                    .marks(q.getMarks())
                    .selectedOption(a != null ? a.getSelectedOption() : null)
                    .textAnswer(a != null ? a.getTextAnswer() : null)
                    .isCorrect(a != null ? a.getIsCorrect() : null)
                    .build());
        }

        int score = session.getScore() != null ? session.getScore() : 0;
        double percentage = totalMarks > 0 ? (score * 100.0 / totalMarks) : 0.0;
        boolean provisional = pendingReview > 0;

        long totalViolations = violationRepository.countBySessionId(sessionId);
        long criticalViolations = violationRepository.countBySessionIdAndSeverity(sessionId, ViolationSeverity.CRITICAL);

        String appliedRole = assignmentRepository.findByExamIdAndStudentId(
                session.getExam().getId(), session.getStudent().getId())
                .map(a -> a.getTrack())
                .orElse(null);

        long timeTaken = (session.getStartTime() != null && session.getEndTime() != null)
                ? java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes()
                : 0L;

        return ExamResultResponse.builder()
                .sessionId(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .studentName(session.getStudent().getName())
                .studentEmail(session.getStudent().getEmail())
                .appliedRole(appliedRole)
                .sessionStatus(session.getStatus().name())
                .score(score)
                .totalMarks(totalMarks)
                .percentage(provisional ? null : Math.round(percentage * 100.0) / 100.0)
                .grade(provisional ? null : toGrade(percentage))
                .totalQuestions(questions.size())
                .attempted(correct + incorrect + pendingReview)
                .correct(correct)
                .incorrect(incorrect)
                .pendingReview(pendingReview)
                .unattempted(unattempted)
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .timeTakenMinutes(timeTaken)
                .totalViolations(totalViolations)
                .criticalViolations(criticalViolations)
                .breakdown(breakdown)
                .build();
    }

    private String toGrade(double percentage) {
        if (percentage >= 90) return "A+";
        if (percentage >= 80) return "A";
        if (percentage >= 70) return "B";
        if (percentage >= 60) return "C";
        if (percentage >= 50) return "D";
        return "F";
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    private int calculateScore(ExamSession session) {
        List<String> tracks = resolveTracksForSession(session);
        return (session.getExam().getId() != null
                ? questionRepository.findByExamIdAndTrackIn(session.getExam().getId(), tracks).stream()
                        .filter(q -> {
                            var answer = answerRepository
                                    .findBySessionIdAndQuestionId(session.getId(), q.getId());
                            return answer.map(a -> Boolean.TRUE.equals(a.getIsCorrect())).orElse(false);
                        })
                        .mapToInt(q -> q.getMarks())
                        .sum()
                : 0);
    }

    private List<String> resolveTracksForSession(ExamSession session) {
        return assignmentRepository.findByExamIdAndStudentId(session.getExam().getId(), session.getStudent().getId())
                .map(a -> a.getTrack() != null ? List.of(a.getTrack(), "COMMON") : List.of("COMMON"))
                .orElse(List.of("COMMON"));
    }

    private ExamSession findSessionById(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateSameOrganization(User user, Exam exam) {
        Organization organization = exam.getOrganization();
        if (organization == null || !Boolean.TRUE.equals(organization.getIsActive())) {
            throw new BadRequestException("Organization is inactive");
        }
        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (user.getOrganization() == null || !Boolean.TRUE.equals(user.getOrganization().getIsActive())
                || !user.getOrganization().getId().equals(organization.getId())) {
            throw new UnauthorizedException("You are not authorized to access this exam");
        }
    }

    private void validateSameOrganization(User user, ExamSession session) {
        Organization organization = session.getOrganization();
        if (organization == null || !Boolean.TRUE.equals(organization.getIsActive())) {
            throw new BadRequestException("Organization is inactive");
        }
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getOrganization() == null || !Boolean.TRUE.equals(user.getOrganization().getIsActive())
                || !user.getOrganization().getId().equals(organization.getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        if (user.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(user.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }

    private SessionResponse toResponse(ExamSession session) {
        return SessionResponse.builder()
                .id(session.getId())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .studentId(session.getStudent().getId())
                .studentName(session.getStudent().getName())
                .orgId(session.getOrganization() != null ? session.getOrganization().getId() : null)
                .orgSlug(session.getOrganization() != null ? session.getOrganization().getSlug() : null)
                .attemptNumber(session.getAttemptNumber())
                .status(session.getStatus())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .score(session.getScore())
                .createdAt(session.getCreatedAt())
                .build();
    }
}
