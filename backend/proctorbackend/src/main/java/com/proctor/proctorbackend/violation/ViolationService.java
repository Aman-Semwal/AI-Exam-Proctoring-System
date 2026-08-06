package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.violation.dto.ViolationRequest;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;

import java.util.List;

public interface ViolationService {

    ViolationResponse recordViolation(ViolationRequest request, String requesterEmail);

    ViolationResponse getViolationById(Long id, String requesterEmail);

    List<ViolationResponse> getViolationsBySession(Long sessionId, String requesterEmail);

    List<ViolationResponse> getUnreviewedBySession(Long sessionId, String requesterEmail);

    ViolationResponse markReviewed(Long id, String requesterEmail);
}
