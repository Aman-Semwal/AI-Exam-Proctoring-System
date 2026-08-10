package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.question.QuestionType;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AnswerServiceImpl implements AnswerService {

    private final AnswerRepository answerRepository;
    private final ExamSessionRepository sessionRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final ExamProctorService examProctorService;

    @Override
    @Transactional
    public AnswerResponse submitAnswer(AnswerRequest request, String studentEmail) {
        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", request.getSessionId()));

        // Verify the authenticated student owns this session
        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You are not authorized to submit answers for this session");
        }

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Answers can only be submitted for active sessions");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", request.getQuestionId()));

        if (!question.getExam().getId().equals(session.getExam().getId())) {
            throw new BadRequestException("Question does not belong to the exam in this session");
        }

        // Upsert: update existing answer if already submitted for this question
        Answer answer = answerRepository
                .findBySessionIdAndQuestionId(request.getSessionId(), request.getQuestionId())
                .orElse(Answer.builder()
                        .session(session)
                        .question(question)
                        .build());

        QuestionType type = question.getQuestionType();
        if (isTextBased(type)) {
            if (request.getTextAnswer() == null || request.getTextAnswer().isBlank()) {
                throw new BadRequestException("textAnswer is required for " + type + " questions");
            }
            answer.setTextAnswer(request.getTextAnswer());
            answer.setSelectedOption(null);
            answer.setIsCorrect(evaluateTextAnswer(request.getTextAnswer(), question));
        } else {
            if (request.getSelectedOption() == null || request.getSelectedOption().isBlank()) {
                throw new BadRequestException("selectedOption is required for " + type + " questions");
            }
            if (question.getOptions() != null && !question.getOptions().containsKey(request.getSelectedOption())) {
                throw new BadRequestException(
                        "selectedOption '" + request.getSelectedOption() + "' is not a valid option for this question");
            }
            answer.setSelectedOption(request.getSelectedOption());
            answer.setTextAnswer(null);
            answer.setIsCorrect(request.getSelectedOption().equals(question.getCorrectOption()));
        }

        return toResponse(answerRepository.save(answer));
    }

    @Override
    public List<AnswerResponse> getAnswersBySession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("ExamSession", sessionId);
        }
        return answerRepository.findBySessionId(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public AnswerResponse getAnswerById(Long id) {
        return toResponse(answerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", id)));
    }

    @Override
    public AnswerResponse gradeAnswer(Long answerId, Boolean isCorrect, String graderEmail) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new ResourceNotFoundException("Answer", answerId));
        Question question = answer.getQuestion();
        if (question.getQuestionType() != QuestionType.CODING && question.getQuestionType() != QuestionType.DESCRIPTIVE) {
            throw new BadRequestException("Only CODING and DESCRIPTIVE answers can be manually graded");
        }

        User grader = userRepository.findByEmail(graderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        validateGraderAccess(grader, answer);

        answer.setIsCorrect(isCorrect);
        return toResponse(answerRepository.save(answer));
    }

    private static final Set<QuestionType> TEXT_BASED_TYPES =
            Set.of(QuestionType.CODING, QuestionType.DESCRIPTIVE, QuestionType.FILL_BLANK);

    private boolean isTextBased(QuestionType type) {
        return TEXT_BASED_TYPES.contains(type);
    }

    /**
     * Evaluates text-based answers:
     * - FILL_BLANK: case-insensitive exact match against correctOption
     * - CODING / DESCRIPTIVE: always null (pending manual/AI review)
     */
    private Boolean evaluateTextAnswer(String textAnswer, Question question) {
        if (question.getQuestionType() == QuestionType.FILL_BLANK
                && question.getCorrectOption() != null) {
            return question.getCorrectOption().trim().equalsIgnoreCase(textAnswer.trim());
        }
        return null; // CODING / DESCRIPTIVE: requires manual or AI grading
    }

    private AnswerResponse toResponse(Answer a) {
        return AnswerResponse.builder()
                .id(a.getId())
                .sessionId(a.getSession().getId())
                .questionId(a.getQuestion().getId())
                .questionText(a.getQuestion().getQuestionText())
                .selectedOption(a.getSelectedOption())
                .textAnswer(a.getTextAnswer())
                .isCorrect(a.getIsCorrect())
                .answeredAt(a.getAnsweredAt())
                .build();
    }

    private void validateGraderAccess(User grader, Answer answer) {
        ExamSession session = answer.getSession();
        if (grader.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (session.getOrganization() == null || grader.getOrganization() == null
                || !session.getOrganization().getId().equals(grader.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to grade this answer");
        }
        if (grader.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(grader.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }
}
