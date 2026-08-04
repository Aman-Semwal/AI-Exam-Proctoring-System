package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;

import java.util.List;

public interface AnswerService {

    AnswerResponse submitAnswer(AnswerRequest request);

    List<AnswerResponse> getAnswersBySession(Long sessionId);

    AnswerResponse getAnswerById(Long id);
}
