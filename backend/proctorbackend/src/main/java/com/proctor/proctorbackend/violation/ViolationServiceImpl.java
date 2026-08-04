package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.SessionRepository;
import com.proctor.proctorbackend.violation.dto.ViolationRequest;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ViolationServiceImpl implements ViolationService {

    private final ViolationRepository violationRepository;
    private final SessionRepository sessionRepository;

    @Override
    @Transactional
    public ViolationResponse recordViolation(ViolationRequest request) {
        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", request.getSessionId()));

        Violation violation = Violation.builder()
                .session(session)
                .type(request.getType())
                .severity(request.getSeverity())
                .details(request.getDetails())
                .reviewed(false)
                .build();

        return toResponse(violationRepository.save(violation));
    }

    @Override
    public ViolationResponse getViolationById(Long id) {
        return toResponse(findById(id));
    }

    @Override
    public List<ViolationResponse> getViolationsBySession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("ExamSession", sessionId);
        }
        return violationRepository.findBySessionId(sessionId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ViolationResponse> getUnreviewedBySession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("ExamSession", sessionId);
        }
        return violationRepository.findBySessionIdAndReviewed(sessionId, false).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ViolationResponse markReviewed(Long id) {
        Violation violation = findById(id);
        violation.setReviewed(true);
        return toResponse(violationRepository.save(violation));
    }

    private Violation findById(Long id) {
        return violationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Violation", id));
    }

    private ViolationResponse toResponse(Violation v) {
        return ViolationResponse.builder()
                .id(v.getId())
                .sessionId(v.getSession().getId())
                .type(v.getType())
                .severity(v.getSeverity())
                .details(v.getDetails())
                .reviewed(v.getReviewed())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
