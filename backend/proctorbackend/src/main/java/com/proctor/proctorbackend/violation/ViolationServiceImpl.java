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
    public ViolationResponse getViolationById(Long id, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Violation violation = findById(id);
        validateSameOrganization(requester, violation);
        return toResponse(violation);
    }

    @Override
    public List<ViolationResponse> getViolationsBySession(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", sessionId));
        validateSameOrganization(requester, session);
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return violationRepository.findBySessionId(sessionId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return violationRepository.findBySessionIdAndOrganizationId(sessionId, requester.getOrganization().getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ViolationResponse> getUnreviewedBySession(Long sessionId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ExamSession", sessionId));
        validateSameOrganization(requester, session);
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return violationRepository.findBySessionIdAndReviewed(sessionId, false).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return violationRepository.findBySessionIdAndOrganizationIdAndReviewed(
                        sessionId, requester.getOrganization().getId(), false).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ViolationResponse markReviewed(Long id, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Violation violation = findById(id);
        validateSameOrganization(requester, violation);
        violation.setReviewed(true);
        return toResponse(violationRepository.save(violation));
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

    private ViolationResponse toResponse(Violation v) {
        return ViolationResponse.builder()
                .id(v.getId())
                .sessionId(v.getSession().getId())
                .orgId(v.getOrganization() != null ? v.getOrganization().getId() : null)
                .orgSlug(v.getOrganization() != null ? v.getOrganization().getSlug() : null)
                .type(v.getType())
                .severity(v.getSeverity())
                .details(v.getDetails())
                .reviewed(v.getReviewed())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
