package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.BrowserEventResponse;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import com.proctor.proctorbackend.violation.ViolationType;

import java.util.List;

public interface ProctoringService {

    ProctoringEventResponse processFrame(FrameUploadRequest request, String studentEmail);

    /**
     * Stores the face embedding of the live reference photo for an active session.
     * Can only be done once per session.
     */
    void enrollReference(Long sessionId, String imageBase64, String studentEmail);

    /**
     * Records a browser-lockdown violation (TAB_SWITCH / FULLSCREEN_EXIT) reported by
     * the student's client, and auto-submits the session once tab switches reach the
     * configured threshold.
     */
    BrowserEventResponse recordBrowserEvent(Long sessionId, ViolationType type, String studentEmail);

    /** Number of violations recorded for the caller's own session (no details exposed). */
    long getMyViolationCount(Long sessionId, String studentEmail);

    List<ProctoringEventResponse> getEventsBySession(Long sessionId, String requesterEmail);
}
