package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.violation.dto.ViolationRequest;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;

import java.util.List;

public interface ViolationService {

    ViolationResponse recordViolation(ViolationRequest request);

    ViolationResponse getViolationById(Long id);

    List<ViolationResponse> getViolationsBySession(Long sessionId);

    List<ViolationResponse> getUnreviewedBySession(Long sessionId);

    ViolationResponse markReviewed(Long id);
}
