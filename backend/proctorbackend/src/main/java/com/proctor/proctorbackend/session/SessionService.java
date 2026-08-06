package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.session.dto.SessionRequest;
import com.proctor.proctorbackend.session.dto.SessionResponse;

import java.util.List;

public interface SessionService {

    SessionResponse startSession(SessionRequest request, String studentEmail);

    SessionResponse endSession(Long sessionId, String studentEmail);

    SessionResponse getSessionById(Long sessionId, String requesterEmail);

    List<SessionResponse> getMySessionsAsStudent(String studentEmail);

    List<SessionResponse> getSessionsByExam(Long examId, String examinerEmail);
}
