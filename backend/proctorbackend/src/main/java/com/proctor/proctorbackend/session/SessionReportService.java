package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.session.dto.SessionReportResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.TrustScore;
import com.proctor.proctorbackend.violation.TrustScoreService;
import com.proctor.proctorbackend.violation.Violation;
import com.proctor.proctorbackend.violation.ViolationEvidenceRepository;
import com.proctor.proctorbackend.violation.ViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Builds the per-session integrity report for staff (synopsis step 6). */
@Service
@RequiredArgsConstructor
public class SessionReportService {

    private final ExamSessionRepository       sessionRepository;
    private final UserRepository              userRepository;
    private final ExamProctorService          examProctorService;
    private final ViolationRepository         violationRepository;
    private final ViolationEvidenceRepository evidenceRepository;
    private final TrustScoreService           trustScoreService;

    @Transactional(readOnly = true)
    public SessionReportResponse getReport(Long sessionId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", requesterEmail));
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        validateAccess(requester, session);

        List<Violation> violations = violationRepository.findBySessionId(sessionId).stream()
                .sorted(Comparator.comparing(Violation::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
        Set<Long> withEvidence = violations.isEmpty() ? Set.of()
                : new HashSet<>(evidenceRepository.findViolationIdsWithEvidence(
                        violations.stream().map(Violation::getId).toList()));
        TrustScore trust = trustScoreService.calculate(sessionId);

        return SessionReportResponse.builder()
                .sessionId(session.getId())
                .attemptNumber(session.getAttemptNumber())
                .status(session.getStatus())
                .startTime(session.getStartTime())
                .endTime(session.getEndTime())
                .durationMinutes(session.getStartTime() != null && session.getEndTime() != null
                        ? Duration.between(session.getStartTime(), session.getEndTime()).toMinutes() : null)
                .studentName(session.getStudent().getName())
                .studentEmail(session.getStudent().getEmail())
                .examId(session.getExam().getId())
                .examTitle(session.getExam().getTitle())
                .score(session.getScore())
                .trustScore(trust.score())
                .trustLevel(trust.level())
                .countsByType(countBy(violations, v -> v.getType().name()))
                .countsBySeverity(countBy(violations, v -> v.getSeverity().name()))
                .timeline(violations.stream().map(v -> SessionReportResponse.Entry.builder()
                        .violationId(v.getId())
                        .time(v.getCreatedAt())
                        .type(v.getType())
                        .severity(v.getSeverity())
                        .details(v.getDetails())
                        .reviewOutcome(v.getReviewOutcome())
                        .hasEvidence(withEvidence.contains(v.getId()))
                        .build()).toList())
                .build();
    }

    private static Map<String, Long> countBy(List<Violation> violations, Function<Violation, String> key) {
        return violations.stream().collect(Collectors.groupingBy(key, TreeMap::new, Collectors.counting()));
    }

    private void validateAccess(User user, ExamSession session) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getRole() == Role.STUDENT) {
            throw new UnauthorizedException("Students cannot view integrity reports");
        }
        if (user.getOrganization() == null || session.getOrganization() == null
                || !user.getOrganization().getId().equals(session.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        if (user.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(user.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }
}
