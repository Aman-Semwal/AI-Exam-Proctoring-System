package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamSessionRepository sessionRepository;
    private final ExamAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));

        validateByType(request);

        Question question = Question.builder()
                .exam(exam)
                .questionType(request.getQuestionType())
                .questionText(request.getQuestionText())
                .options(buildOptions(request))
            .correctOption(normalizeCorrectOption(request))
            .metadata(request.getMetadata())
                .marks(request.getMarks())
                .track(request.getTrack() != null ? request.getTrack() : "COMMON")
                .build();

        return toResponse(questionRepository.save(question), true);
    }

    @Override
    public QuestionResponse getQuestionById(Long id, boolean includeAnswer) {
        return toResponse(findById(id), includeAnswer);
    }

    @Override
    public List<QuestionResponse> getQuestionsByExam(Long examId, boolean includeAnswer) {
        if (!examRepository.existsById(examId)) {
            throw new ResourceNotFoundException("Exam", examId);
        }
        return questionRepository.findByExamId(examId).stream()
                .map(q -> toResponse(q, includeAnswer))
                .toList();
    }

    @Override
    public List<QuestionResponse> getQuestionsByExam(Long examId, boolean includeAnswer, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        if (requester.getRole() != Role.STUDENT) {
            return getQuestionsByExam(examId, includeAnswer);
        }

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        validateStudentExamAccess(requester, exam);

        List<String> tracks = resolveTracks(examId, requester.getId());
        return questionRepository.findByExamIdAndTrackIn(examId, tracks).stream()
                .map(q -> toResponse(q, false))
                .toList();
    }

    @Override
    public List<QuestionResponse> getQuestionsForSession(Long sessionId, String studentEmail) {
        User student = getUserByEmail(studentEmail);
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        if (student.getRole() != Role.STUDENT || !session.getStudent().getId().equals(student.getId())) {
            throw new UnauthorizedException("You are not authorized to access this session's questions");
        }
        validateStudentExamAccess(student, session.getExam());

        Long examId = session.getExam().getId();
        List<String> tracks = resolveTracks(examId, student.getId());
        return questionRepository.findByExamIdAndTrackIn(examId, tracks).stream()
                .map(q -> toResponse(q, false))
                .toList();
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = findById(id);

        // Update exam if examId has changed
        if (!question.getExam().getId().equals(request.getExamId())) {
            Exam newExam = examRepository.findById(request.getExamId())
                    .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));
            question.setExam(newExam);
        }

        validateByType(request);

        question.setQuestionType(request.getQuestionType());
        question.setQuestionText(request.getQuestionText());
        question.setOptions(buildOptions(request));
        question.setCorrectOption(normalizeCorrectOption(request));
        question.setMetadata(request.getMetadata());
        question.setMarks(request.getMarks());
        question.setTrack(request.getTrack() != null ? request.getTrack() : "COMMON");

        return toResponse(questionRepository.save(question), true);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        questionRepository.delete(findById(id));
    }

    // -----------------------------------------------------------------------
    // Type-specific validation
    // -----------------------------------------------------------------------

    /**
     * Validates fields per question type:
     *
     * MCQ        → options required (≥2), correctOption required and must be a key in options
     * TRUE_FALSE → correctOption required, must be "True" or "False"
     * FILL_BLANK → correctOption required (the expected answer text)
     * DESCRIPTIVE→ no correctOption or options needed
     * CODING     → metadata required; must contain at least "language" and "testCases"
     */
    private void validateByType(QuestionRequest req) {
        switch (req.getQuestionType()) {
            case MCQ -> {
                if (req.getOptions() == null || req.getOptions().size() < 2) {
                    throw new BadRequestException("MCQ question requires at least 2 options");
                }
                if (req.getCorrectOption() == null || req.getCorrectOption().isBlank()) {
                    throw new BadRequestException("MCQ question requires a correctOption");
                }
                if (!req.getOptions().containsKey(req.getCorrectOption())) {
                    throw new BadRequestException(
                            "correctOption '" + req.getCorrectOption() + "' must be one of the provided option keys");
                }
            }
            case TRUE_FALSE -> {
                if (req.getCorrectOption() == null
                        || (!req.getCorrectOption().equalsIgnoreCase("True")
                            && !req.getCorrectOption().equalsIgnoreCase("False"))) {
                    throw new BadRequestException("TRUE_FALSE question requires correctOption to be 'True' or 'False'");
                }
            }
            case FILL_BLANK -> {
                if (req.getCorrectOption() == null || req.getCorrectOption().isBlank()) {
                    throw new BadRequestException("FILL_BLANK question requires correctOption (the expected answer)");
                }
            }
            case DESCRIPTIVE -> {
                // No options or correctOption needed — graded manually or by AI
            }
            case CODING -> {
                if (req.getMetadata() == null) {
                    throw new BadRequestException("CODING question requires metadata (language, testCases)");
                }
                if (!req.getMetadata().containsKey("language")) {
                    throw new BadRequestException("CODING question metadata must include 'language'");
                }
                if (!req.getMetadata().containsKey("testCases")) {
                    throw new BadRequestException("CODING question metadata must include 'testCases'");
                }
            }
        }
    }

    /**
     * For TRUE_FALSE, auto-generate the options map so students see {"True":"True","False":"False"}.
     * For all other types, use the options from the request as-is (may be null).
     */
    private Map<String, String> buildOptions(QuestionRequest req) {
        if (req.getQuestionType() == QuestionType.TRUE_FALSE) {
            return Map.of("True", "True", "False", "False");
        }
        return req.getOptions();
    }

    private String normalizeCorrectOption(QuestionRequest req) {
        if (req.getQuestionType() != QuestionType.TRUE_FALSE || req.getCorrectOption() == null) {
            return req.getCorrectOption();
        }
        return req.getCorrectOption().equalsIgnoreCase("True") ? "True" : "False";
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private Question findById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateStudentExamAccess(User student, Exam exam) {
        if (student.getOrganization() == null
                || exam.getOrganization() == null
                || !student.getOrganization().getId().equals(exam.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this exam");
        }
        if (!assignmentRepository.existsByExamIdAndStudentId(exam.getId(), student.getId())) {
            throw new UnauthorizedException("You are not assigned to this exam");
        }
    }

    private List<String> resolveTracks(Long examId, Long studentId) {
        return assignmentRepository.findByExamIdAndStudentId(examId, studentId)
                .map(a -> a.getTrack() != null && !a.getTrack().isBlank()
                        ? List.of(a.getTrack(), "COMMON")
                        : List.of("COMMON"))
                .orElse(List.of("COMMON"));
    }

    private QuestionResponse toResponse(Question q, boolean includeAnswer) {
        return QuestionResponse.builder()
                .id(q.getId())
                .examId(q.getExam().getId())
                .questionType(q.getQuestionType())
                .questionText(q.getQuestionText())
                .options(q.getOptions())
                .correctOption(includeAnswer ? q.getCorrectOption() : null)
                .metadata(includeAnswer ? q.getMetadata() : sanitizeMetadata(q.getMetadata()))
                .marks(q.getMarks())
                .track(q.getTrack())
                .createdAt(q.getCreatedAt())
                .build();
    }

    private Map<String, Object> sanitizeMetadata(Map<String, Object> metadata) {
        if (metadata == null) {
            return null;
        }
        Map<String, Object> publicMetadata = new LinkedHashMap<>(metadata);
        Set.of("testCases", "hiddenTestCases", "expectedOutput", "expectedOutputs", "answerKey", "rubric")
                .forEach(publicMetadata::remove);
        return publicMetadata;
    }
}
