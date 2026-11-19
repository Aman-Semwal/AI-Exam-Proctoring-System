package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;

import java.util.List;

public interface AnswerService {

    AnswerResponse submitAnswer(AnswerRequest request, String studentEmail);

    /** Students: own session only, correctness hidden while the session is active. */
    List<AnswerResponse> getAnswersBySession(Long sessionId, String requesterEmail);

    AnswerResponse getAnswerById(Long id, String requesterEmail);

    /** Manually grade a CODING or DESCRIPTIVE answer (proctor/admin only). */
    AnswerResponse gradeAnswer(Long answerId, Boolean isCorrect, String graderEmail);
}
