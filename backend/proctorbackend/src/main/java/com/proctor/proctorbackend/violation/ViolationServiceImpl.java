package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
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
    private final ExamSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final ExamProctorService examProctorService;
    private final ViolationEvidenceRepository evidenceRepository;

    @Override
    @Transactional
    public ViolationResponse recordViolation(ViolationRequest request, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", request.getSessionId()));
        validateSameOrganization(requester, session);

        Violation violation = Violation.builder()
                .session(session)
                .organization(session.getOrganization())
                .type(request.getType())
                .severity(request.getSeverity())
                .details(request.getDetails())
                .reviewed(false)
                .build();

        return toResponse(violationRepository.save(violation));
    }

    @Override
    @Transactional(readOnly = true)
    public ViolationResponse getViolationById(Long id, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Violation violation = findById(id);
        validateSameOrganization(requester, violation);
        return toResponse(violation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ViolationResponse> getViolationsBySession(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", sessionId));
        validateSameOrganization(requester, session);
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return toResponses(violationRepository.findBySessionId(sessionId));
        }
        return toResponses(violationRepository.findBySessionIdAndOrganizationId(sessionId, requester.getOrganization().getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ViolationResponse> getUnreviewedBySession(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", sessionId));
        validateSameOrganization(requester, session);
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return toResponses(violationRepository.findBySessionIdAndReviewed(sessionId, false));
        }
        return toResponses(violationRepository.findBySessionIdAndOrganizationIdAndReviewed(
                        sessionId, requester.getOrganization().getId(), false));
    }

    @Override
    @Transactional
    public ViolationResponse markReviewed(Long id, ReviewOutcome outcome, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Violation violation = findById(id);
        validateSameOrganization(requester, violation);
        violation.setReviewed(true);
        violation.setReviewOutcome(outcome != null ? outcome : ReviewOutcome.CONFIRMED);
        return toResponse(violationRepository.save(violation));
    }

    @Override
    @Transactional(readOnly = true)
    public ViolationEvidence getEvidence(Long violationId, String requesterEmail) {
        Violation violation = findById(violationId);
        validateSameOrganization(getUserByEmail(requesterEmail), violation);
        return evidenceRepository.findFirstByViolationId(violationId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence for violation", violationId));
    }

    private Violation findById(Long id) {
        return violationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Violation", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateSameOrganization(User user, ExamSession session) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getOrganization() == null || session.getOrganization() == null
                || !user.getOrganization().getId().equals(session.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        if (user.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(user.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }

    private void validateSameOrganization(User user, Violation violation) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getOrganization() == null || violation.getOrganization() == null
                || !user.getOrganization().getId().equals(violation.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this violation");
        }
        if (user.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(user.getId(), violation.getSession().getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }

    private List<ViolationResponse> toResponses(List<Violation> violations) {
        if (violations.isEmpty()) return List.of();
        java.util.Set<Long> withEvidence = new java.util.HashSet<>(
                evidenceRepository.findViolationIdsWithEvidence(violations.stream().map(Violation::getId).toList()));
        return violations.stream().map(v -> toResponse(v, withEvidence.contains(v.getId()))).toList();
    }

    private ViolationResponse toResponse(Violation v) {
        boolean hasEvidence = v.getId() != null
                && !evidenceRepository.findViolationIdsWithEvidence(List.of(v.getId())).isEmpty();
        return toResponse(v, hasEvidence);
    }

    private ViolationResponse toResponse(Violation v, boolean hasEvidence) {
        return ViolationResponse.builder()
                .hasEvidence(hasEvidence)
                .id(v.getId())
                .sessionId(v.getSession().getId())
                .orgId(v.getOrganization() != null ? v.getOrganization().getId() : null)
                .orgSlug(v.getOrganization() != null ? v.getOrganization().getSlug() : null)
                .type(v.getType())
                .severity(v.getSeverity())
                .reviewOutcome(v.getReviewOutcome())
                .browserSignal(v.getBrowserSignal())
                .awaySeconds(v.getAwaySeconds())
                .details(v.getDetails())
                .reviewed(v.getReviewed())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
