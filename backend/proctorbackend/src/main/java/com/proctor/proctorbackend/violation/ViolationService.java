package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.violation.dto.ViolationRequest;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;

import java.util.List;

public interface ViolationService {

    ViolationResponse recordViolation(ViolationRequest request, String requesterEmail);

    ViolationResponse getViolationById(Long id, String requesterEmail);

    List<ViolationResponse> getViolationsBySession(Long sessionId, String requesterEmail);

    List<ViolationResponse> getUnreviewedBySession(Long sessionId, String requesterEmail);

    /** @param outcome null means CONFIRMED */
    /** The webcam frame behind a violation; 404 when there is none (e.g. browser events). */
    ViolationEvidence getEvidence(Long violationId, String requesterEmail);

    ViolationResponse markReviewed(Long id, ReviewOutcome outcome, String requesterEmail);
}
