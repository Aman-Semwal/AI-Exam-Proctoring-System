package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class QuestionServiceImpl implements QuestionService {

    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;

    @Override
    @Transactional
    public QuestionResponse createQuestion(QuestionRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));

        if (!request.getOptions().containsKey(request.getCorrectOption())) {
            throw new BadRequestException(
                    "correctOption '" + request.getCorrectOption() + "' must be one of the provided option keys");
        }

        Question question = Question.builder()
                .exam(exam)
                .questionText(request.getQuestionText())
                .options(request.getOptions())
                .correctOption(request.getCorrectOption())
                .marks(request.getMarks())
                .build();

        return toResponse(questionRepository.save(question), true);
    }

    @Override
    public QuestionResponse getQuestionById(Long id, boolean includeAnswer) {
        Question question = findById(id);
        return toResponse(question, includeAnswer);
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
    @Transactional
    public QuestionResponse updateQuestion(Long id, QuestionRequest request) {
        Question question = findById(id);

        if (!request.getOptions().containsKey(request.getCorrectOption())) {
            throw new BadRequestException(
                    "correctOption '" + request.getCorrectOption() + "' must be one of the provided option keys");
        }

        question.setQuestionText(request.getQuestionText());
        question.setOptions(request.getOptions());
        question.setCorrectOption(request.getCorrectOption());
        question.setMarks(request.getMarks());

        return toResponse(questionRepository.save(question), true);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long id) {
        Question question = findById(id);
        questionRepository.delete(question);
    }

    private Question findById(Long id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question", id));
    }

    private QuestionResponse toResponse(Question q, boolean includeAnswer) {
        return QuestionResponse.builder()
                .id(q.getId())
                .examId(q.getExam().getId())
                .questionText(q.getQuestionText())
                .options(q.getOptions())
                .correctOption(includeAnswer ? q.getCorrectOption() : null)
                .marks(q.getMarks())
                .createdAt(q.getCreatedAt())
                .build();
    }
}
