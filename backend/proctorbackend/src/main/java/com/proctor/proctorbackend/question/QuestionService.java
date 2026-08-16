package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;

import java.util.List;

public interface QuestionService {

    QuestionResponse createQuestion(QuestionRequest request);

    QuestionResponse getQuestionById(Long id, boolean includeAnswer);

    List<QuestionResponse> getQuestionsByExam(Long examId, boolean includeAnswer);

    List<QuestionResponse> getQuestionsByExam(Long examId, boolean includeAnswer, String requesterEmail);

    List<QuestionResponse> getQuestionsForSession(Long sessionId, String studentEmail);

    QuestionResponse updateQuestion(Long id, QuestionRequest request);

    void deleteQuestion(Long id);
}
