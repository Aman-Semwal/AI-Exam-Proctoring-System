package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.SessionRepository;
import com.proctor.proctorbackend.session.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnswerServiceImpl implements AnswerService {

    private final AnswerRepository answerRepository;
    private final SessionRepository sessionRepository;
    private final QuestionRepository questionRepository;

    @Override
    @Transactional
    public AnswerResponse submitAnswer(AnswerRequest request) {
        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", request.getSessionId()));

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new BadRequestException("Answers can only be submitted for active sessions");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", request.getQuestionId()));

        if (!question.getExam().getId().equals(session.getExam().getId())) {
            throw new BadRequestException("Question does not belong to the exam in this session");
        }

        if (!question.getOptions().containsKey(request.getSelectedOption())) {
            throw new BadRequestException(
                    "selectedOption '" + request.getSelectedOption() + "' is not a valid option for this question");
        }

        // Upsert: update existing answer if already submitted for this question
        Answer answer = answerRepository
                .findBySessionIdAndQuestionId(request.getSessionId(), request.getQuestionId())
                .orElse(Answer.builder()
                        .session(session)
                        .question(question)
                        .build());

        answer.setSelectedOption(request.getSelectedOption());
        answer.setIsCorrect(request.getSelectedOption().equals(question.getCorrectOption()));

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

    private AnswerResponse toResponse(Answer a) {
        return AnswerResponse.builder()
                .id(a.getId())
                .sessionId(a.getSession().getId())
                .questionId(a.getQuestion().getId())
                .questionText(a.getQuestion().getQuestionText())
                .selectedOption(a.getSelectedOption())
                .isCorrect(a.getIsCorrect())
                .answeredAt(a.getAnsweredAt())
                .build();
    }
}
