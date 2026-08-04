package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;

import java.util.List;

public interface ProctoringService {

    ProctoringEventResponse processFrame(FrameUploadRequest request, String studentEmail);

    List<ProctoringEventResponse> getEventsBySession(Long sessionId);
}
