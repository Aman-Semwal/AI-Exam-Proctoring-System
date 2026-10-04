package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.session.dto.SessionReportResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionReportServiceTest {

    @Mock ExamSessionRepository sessionRepository;
    @Mock UserRepository userRepository;
    @Mock ExamProctorService examProctorService;
    @Mock ViolationRepository violationRepository;
    @Mock ViolationEvidenceRepository evidenceRepository;
    @Mock TrustScoreService trustScoreService;
    @InjectMocks SessionReportService service;

    Organization org;
    ExamSession session;
    LocalDateTime t0 = LocalDateTime.of(2026, 10, 5, 4, 0);

    @BeforeEach
    void setUp() {
        org = Organization.builder().id(1L).isActive(true).build();
        User student = User.builder().id(2L).name("Stu").email("s@a.com").role(Role.STUDENT).organization(org).build();
        session = ExamSession.builder().id(55L).attemptNumber(1).status(SessionStatus.COMPLETED)
                .exam(Exam.builder().id(10L).title("Java").build()).student(student).organization(org)
                .startTime(t0).endTime(t0.plusMinutes(42)).score(30).build();
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(session));
    }

    private void actingAs(Role role, Organization userOrg) {
        when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.of(
                User.builder().id(7L).email("u@x.com").role(role).organization(userOrg).build()));
    }

    private Violation v(long id, ViolationType type, ViolationSeverity sev, int minute) {
        Violation v = Violation.builder().id(id).session(session).type(type).severity(sev)
                .details(type.name()).reviewed(false).build();
        v.setCreatedAt(t0.plusMinutes(minute));
        return v;
    }

    @Test
    void report_containsSummaryCountsAndChronologicalTimeline() {
        actingAs(Role.ORG_ADMIN, org);
        when(violationRepository.findBySessionId(55L)).thenReturn(List.of(
                v(2, ViolationType.TAB_SWITCH, ViolationSeverity.HIGH, 20),
                v(1, ViolationType.LOOKING_AWAY, ViolationSeverity.MEDIUM, 5),
                v(3, ViolationType.LOOKING_AWAY, ViolationSeverity.MEDIUM, 30)));
        when(evidenceRepository.findViolationIdsWithEvidence(anyCollection())).thenReturn(List.of(1L, 3L));
        when(trustScoreService.calculate(55L)).thenReturn(new TrustScore(80, TrustLevel.TRUSTED));

        SessionReportResponse r = service.getReport(55L, "u@x.com");

        assertEquals("Stu", r.getStudentName());
        assertEquals("Java", r.getExamTitle());
        assertEquals(30, r.getScore());
        assertEquals(42L, r.getDurationMinutes());
        assertEquals(80, r.getTrustScore());
        assertEquals(2L, r.getCountsByType().get("LOOKING_AWAY"));
        assertEquals(1L, r.getCountsBySeverity().get("HIGH"));
        assertEquals(List.of(1L, 2L, 3L), r.getTimeline().stream().map(SessionReportResponse.Entry::getViolationId).toList());
        assertTrue(r.getTimeline().get(0).isHasEvidence());
        assertFalse(r.getTimeline().get(1).isHasEvidence());
    }

    @Test
    void report_otherOrg_rejected() {
        actingAs(Role.ORG_ADMIN, Organization.builder().id(2L).isActive(true).build());

        assertThrows(UnauthorizedException.class, () -> service.getReport(55L, "u@x.com"));
    }

    @Test
    void report_unassignedProctor_rejected() {
        actingAs(Role.PROCTOR, org);
        when(examProctorService.isProctorAssignedToExam(7L, 10L)).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> service.getReport(55L, "u@x.com"));
    }

    @Test
    void report_student_rejected() {
        actingAs(Role.STUDENT, org);

        assertThrows(UnauthorizedException.class, () -> service.getReport(55L, "u@x.com"));
    }
}
