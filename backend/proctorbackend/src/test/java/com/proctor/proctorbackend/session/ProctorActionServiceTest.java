package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.Violation;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProctorActionServiceTest {

    @Mock ExamSessionRepository sessionRepository;
    @Mock UserRepository userRepository;
    @Mock ExamProctorService examProctorService;
    @Mock ViolationRepository violationRepository;
    @Mock ScoreCalculationService scoreCalculationService;
    @Mock SimpMessagingTemplate messagingTemplate;
    @InjectMocks ProctorActionService service;

    Organization org;
    ExamSession session;
    User proctor;

    @BeforeEach
    void setUp() {
        org = Organization.builder().id(1L).slug("a").isActive(true).build();
        User student = User.builder().id(2L).email("s@a.com").name("Stu").role(Role.STUDENT).organization(org).build();
        session = ExamSession.builder().id(55L).exam(Exam.builder().id(10L).build())
                .student(student).organization(org).status(SessionStatus.ACTIVE).build();
        proctor = User.builder().id(5L).email("p@a.com").role(Role.PROCTOR).organization(org).build();
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(session));
        lenient().when(userRepository.findByEmail("p@a.com")).thenReturn(Optional.of(proctor));
        lenient().when(examProctorService.isProctorAssignedToExam(5L, 10L)).thenReturn(true);
    }

    @Test
    void terminate_assignedProctor_terminatesScoresRecordsAndNotifies() {
        when(scoreCalculationService.calculate(session)).thenReturn(8);

        service.terminate(55L, "Phone in hand", "p@a.com");

        assertEquals(SessionStatus.TERMINATED, session.getStatus());
        assertEquals(8, session.getScore());
        assertNotNull(session.getEndTime());
        verify(sessionRepository).save(session);
        verify(violationRepository).save(argThat((Violation v) ->
                v.getType() == ViolationType.OTHER
                        && v.getSeverity() == ViolationSeverity.CRITICAL
                        && v.getDetails().contains("Phone in hand")));
        verify(messagingTemplate).convertAndSendToUser(eq("s@a.com"), eq("/queue/session-events"),
                argThat((AlertMessage m) -> "SESSION_TERMINATED".equals(m.getEventType())));
    }

    @Test
    void terminate_proctorAlert_carriesTheRecordedViolationId() {
        when(violationRepository.save(any())).thenAnswer(inv -> {
            Violation v = inv.getArgument(0);
            v.setId(321L);
            return v;
        });

        service.terminate(55L, "Phone in hand", "p@a.com");

        verify(messagingTemplate).convertAndSend(eq("/topic/alerts/10"),
                argThat((AlertMessage m) -> Long.valueOf(321L).equals(m.getViolationId())));
    }

    @Test
    void terminate_unassignedProctor_rejected() {
        when(examProctorService.isProctorAssignedToExam(5L, 10L)).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> service.terminate(55L, "x", "p@a.com"));
        assertEquals(SessionStatus.ACTIVE, session.getStatus());
    }

    @Test
    void terminate_examCreatorRole_rejected() {
        when(userRepository.findByEmail("c@a.com")).thenReturn(Optional.of(
                User.builder().id(6L).email("c@a.com").role(Role.EXAM_CREATOR).organization(org).build()));

        assertThrows(UnauthorizedException.class, () -> service.terminate(55L, "x", "c@a.com"));
    }

    @Test
    void terminate_inactiveSession_conflict() {
        session.setStatus(SessionStatus.COMPLETED);

        assertThrows(IllegalStateException.class, () -> service.terminate(55L, "x", "p@a.com"));
    }

    @Test
    void warn_sendsMessageToStudentQueue() {
        service.warn(55L, "Please face the camera", "p@a.com");

        verify(messagingTemplate).convertAndSendToUser(eq("s@a.com"), eq("/queue/session-events"),
                argThat((AlertMessage m) -> "PROCTOR_WARNING".equals(m.getEventType())
                        && "Please face the camera".equals(m.getDetails())));
    }

    @Test
    void warn_otherOrgAdmin_rejected() {
        when(userRepository.findByEmail("x@b.com")).thenReturn(Optional.of(
                User.builder().id(7L).email("x@b.com").role(Role.ORG_ADMIN)
                        .organization(Organization.builder().id(2L).isActive(true).build()).build()));

        assertThrows(UnauthorizedException.class, () -> service.warn(55L, "hi", "x@b.com"));
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
    }
}
