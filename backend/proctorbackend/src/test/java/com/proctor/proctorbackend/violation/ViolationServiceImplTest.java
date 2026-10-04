package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ViolationServiceImplTest {

    @Mock ViolationRepository violationRepository;
    @Mock ExamSessionRepository sessionRepository;
    @Mock UserRepository userRepository;
    @Mock ExamProctorService examProctorService;
    @Mock ViolationEvidenceRepository evidenceRepository;
    @InjectMocks ViolationServiceImpl service;

    Violation violation;

    @BeforeEach
    void setUp() {
        Organization org = Organization.builder().id(1L).slug("a").build();
        ExamSession session = ExamSession.builder().id(55L)
                .exam(Exam.builder().id(10L).build()).organization(org).build();
        violation = Violation.builder().id(9L).session(session).organization(org)
                .type(ViolationType.LOOKING_AWAY).severity(ViolationSeverity.MEDIUM).reviewed(false).build();
        lenient().when(userRepository.findByEmail("admin@a.com")).thenReturn(Optional.of(
                User.builder().id(3L).email("admin@a.com").role(Role.ORG_ADMIN).organization(org).build()));
        when(violationRepository.findById(9L)).thenReturn(Optional.of(violation));
        lenient().when(violationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void getEvidence_sameOrg_returnsImage() {
        ViolationEvidence evidence = ViolationEvidence.builder()
                .violation(violation).contentType("image/jpeg").data(new byte[]{9}).build();
        when(evidenceRepository.findFirstByViolationId(9L)).thenReturn(Optional.of(evidence));

        assertArrayEquals(new byte[]{9}, service.getEvidence(9L, "admin@a.com").getData());
    }

    @Test
    void getEvidence_none_throwsNotFound() {
        when(evidenceRepository.findFirstByViolationId(9L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.getEvidence(9L, "admin@a.com"));
    }

    @Test
    void getEvidence_otherOrg_rejected() {
        when(userRepository.findByEmail("x@b.com")).thenReturn(Optional.of(
                User.builder().id(4L).email("x@b.com").role(Role.ORG_ADMIN)
                        .organization(Organization.builder().id(2L).build()).build()));

        assertThrows(UnauthorizedException.class, () -> service.getEvidence(9L, "x@b.com"));
    }

    @Test
    void review_dismissed_marksFalsePositive() {
        ViolationResponse resp = service.markReviewed(9L, ReviewOutcome.DISMISSED, "admin@a.com");

        assertTrue(resp.getReviewed());
        assertEquals(ReviewOutcome.DISMISSED, resp.getReviewOutcome());
    }

    @Test
    void review_withoutOutcome_defaultsToConfirmed() {
        ViolationResponse resp = service.markReviewed(9L, null, "admin@a.com");

        assertEquals(ReviewOutcome.CONFIRMED, resp.getReviewOutcome());
    }
}
