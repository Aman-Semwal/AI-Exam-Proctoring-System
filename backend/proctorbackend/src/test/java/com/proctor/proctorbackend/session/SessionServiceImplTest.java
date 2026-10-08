package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.session.dto.SessionRequest;
import com.proctor.proctorbackend.session.dto.SessionResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.violation.TrustLevel;
import com.proctor.proctorbackend.violation.TrustScore;
import com.proctor.proctorbackend.violation.TrustScoreService;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionServiceImplTest {

    @Mock ExamSessionRepository sessionRepository;
    @Mock ExamRepository examRepository;
    @Mock UserRepository userRepository;
    @Mock AnswerRepository answerRepository;
    @Mock QuestionRepository questionRepository;
    @Mock ExamAssignmentRepository assignmentRepository;
    @Mock ExamProctorService examProctorService;
    @Mock ViolationRepository violationRepository;
    @Mock ScoreCalculationService scoreCalculationService;
    @Mock TrustScoreService trustScoreService;
    @InjectMocks SessionServiceImpl service;

    Organization org;
    Exam exam;
    User student;
    User orgAdmin;
    ExamSession activeSession;

    @BeforeEach
    void setUp() {
        org = Organization.builder().id(1L).name("Infosys").slug("infosys").isActive(true).build();
        exam = Exam.builder().id(10L).title("SDE1 Exam").organization(org).durationMinutes(90).build();
        student = User.builder().id(2L).email("rahul@gmail.com").role(Role.STUDENT).organization(org).build();
        orgAdmin = User.builder().id(1L).email("admin@infosys.com").role(Role.ORG_ADMIN).organization(org).build();
        activeSession = ExamSession.builder().id(55L).exam(exam).student(student)
                .organization(org).status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now().minusMinutes(30)).build();
    }

    // --- startSession ---

    @Test
    void startSession_throwsWhenExamNotStartedYet() {
        exam.setStartTime(LocalDateTime.now().plusHours(1));
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.startSession(req, "rahul@gmail.com"));
    }

    @Test
    void startSession_throwsWhenExamWindowClosed() {
        Exam closedExam = Exam.builder().id(10L).title("SDE1 Exam").organization(org)
                .durationMinutes(90)
                .startTime(LocalDateTime.now().minusHours(3))
                .endTime(LocalDateTime.now().minusHours(1))
                .build();
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(closedExam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.startSession(req, "rahul@gmail.com"));
    }

    @Test
    void startSession_throwsWhenAlreadyActiveSession() {
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);
        when(sessionRepository.existsByExamIdAndStudentIdAndStatus(10L, 2L, SessionStatus.ACTIVE)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.startSession(req, "rahul@gmail.com"));
    }

    @Test
    void startSession_refusesOnceAttemptsAreUsedUp() {
        // default rule: 1 attempt — an auto-submitted student must not simply start over
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);
        when(sessionRepository.existsByExamIdAndStudentIdAndStatus(10L, 2L, SessionStatus.ACTIVE)).thenReturn(false);
        when(sessionRepository.countByExamIdAndStudentId(10L, 2L)).thenReturn(1L);

        BadRequestException ex = assertThrows(BadRequestException.class,
                () -> service.startSession(req, "rahul@gmail.com"));
        assertTrue(ex.getMessage().contains("already attempted"), ex.getMessage());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    void startSession_allowsAnotherAttemptWhenTheExamPermitsIt() {
        exam.getProctoringRules().setMaxAttempts(2);
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);
        when(sessionRepository.existsByExamIdAndStudentIdAndStatus(10L, 2L, SessionStatus.ACTIVE)).thenReturn(false);
        when(sessionRepository.countByExamIdAndStudentId(10L, 2L)).thenReturn(1L);
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertEquals(2, service.startSession(req, "rahul@gmail.com").getAttemptNumber());
    }

    @Test
    void startSession_throwsWhenNotAssigned() {
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> service.startSession(req, "rahul@gmail.com"));
    }

    @Test
    void startSession_successCreatesSession() {
        SessionRequest req = new SessionRequest();
        req.setExamId(10L);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);
        when(sessionRepository.existsByExamIdAndStudentIdAndStatus(10L, 2L, SessionStatus.ACTIVE)).thenReturn(false);
        when(sessionRepository.countByExamIdAndStudentId(10L, 2L)).thenReturn(0L);
        when(sessionRepository.save(any())).thenAnswer(inv -> {
            ExamSession s = inv.getArgument(0);
            s = ExamSession.builder().id(55L).exam(s.getExam()).student(s.getStudent())
                    .organization(s.getOrganization()).status(s.getStatus())
                    .attemptNumber(s.getAttemptNumber()).startTime(s.getStartTime()).build();
            return s;
        });

        SessionResponse resp = service.startSession(req, "rahul@gmail.com");

        assertEquals(55L, resp.getId());
        assertEquals(SessionStatus.ACTIVE, resp.getStatus());
        assertEquals(1, resp.getAttemptNumber());
    }

    // --- endSession ---

    @Test
    void endSession_throwsWhenNotOwner() {
        User other = User.builder().id(99L).email("other@gmail.com").role(Role.STUDENT).organization(org).build();
        when(userRepository.findByEmail("other@gmail.com")).thenReturn(Optional.of(other));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class, () -> service.endSession(55L, "other@gmail.com"));
    }

    @Test
    void endSession_throwsWhenSessionNotActive() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(BadRequestException.class, () -> service.endSession(55L, "rahul@gmail.com"));
    }

    @Test
    void endSession_calculatesScoreAndCompletes() {
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(scoreCalculationService.calculate(activeSession)).thenReturn(7);
        when(sessionRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        SessionResponse resp = service.endSession(55L, "rahul@gmail.com");

        assertEquals(SessionStatus.COMPLETED, resp.getStatus());
        assertEquals(7, resp.getScore());
        assertNotNull(resp.getEndTime());
    }

    // --- referenceEnrolled flag (resume must not skip the identity photo) ---

    @Test
    void getSessionById_reportsReferenceNotEnrolled() {
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertFalse(service.getSessionById(55L, "rahul@gmail.com").isReferenceEnrolled());
    }

    @Test
    void getSessionById_reportsReferenceEnrolled() {
        activeSession.setReferenceEmbedding(java.util.List.of(0.1, 0.2));
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertTrue(service.getSessionById(55L, "rahul@gmail.com").isReferenceEnrolled());
    }

    @Test
    void getSessionById_includesTotalMarks() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(scoreCalculationService.totalMarks(activeSession)).thenReturn(10);

        assertEquals(10, service.getSessionById(55L, "rahul@gmail.com").getTotalMarks());
    }

    @Test
    void getSessionById_finishedWithUngradedAnswers_isProvisional() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(answerRepository.countBySessionIdAndIsCorrectIsNull(55L)).thenReturn(1L);

        assertTrue(service.getSessionById(55L, "rahul@gmail.com").isResultProvisional());
    }

    @Test
    void getSessionById_finishedAndFullyGraded_isFinal() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(answerRepository.countBySessionIdAndIsCorrectIsNull(55L)).thenReturn(0L);

        assertFalse(service.getSessionById(55L, "rahul@gmail.com").isResultProvisional());
    }

    @Test
    void getSessionById_activeSession_skipsTotalMarksQuery() {
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertNull(service.getSessionById(55L, "rahul@gmail.com").getTotalMarks());
        verify(scoreCalculationService, never()).totalMarks(any());
    }

    @Test
    void getSessionById_includesTrustScore() {
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(trustScoreService.calculate(55L)).thenReturn(new TrustScore(65, TrustLevel.REVIEW));

        SessionResponse resp = service.getSessionById(55L, "rahul@gmail.com");

        assertEquals(65, resp.getTrustScore());
        assertEquals(TrustLevel.REVIEW, resp.getTrustLevel());
    }

    // --- getExamResult access control ---

    @Test
    void getExamResult_throwsForProctor() {
        User proctor = User.builder().id(5L).email("proctor@infosys.com")
                .role(Role.PROCTOR).organization(org).build();
        activeSession.setStatus(SessionStatus.COMPLETED);

        when(userRepository.findByEmail("proctor@infosys.com")).thenReturn(Optional.of(proctor));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class, () -> service.getExamResult(55L, "proctor@infosys.com"));
    }

    @Test
    void getExamResult_allowsStudentOwnFinishedSession() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        activeSession.setScore(10);

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(questionRepository.findByExamId(10L)).thenReturn(java.util.List.of());
        when(answerRepository.findBySessionId(55L)).thenReturn(java.util.List.of());

        assertEquals(10, service.getExamResult(55L, "rahul@gmail.com").getScore());
    }

    @Test
    void getExamResult_throwsForStudentWhileSessionActive() {
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(student));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class, () -> service.getExamResult(55L, "rahul@gmail.com"));
    }

    @Test
    void getExamResult_throwsForAnotherStudent() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        User other = User.builder().id(9L).email("other@gmail.com").role(Role.STUDENT).organization(org).build();

        when(userRepository.findByEmail("other@gmail.com")).thenReturn(Optional.of(other));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class, () -> service.getExamResult(55L, "other@gmail.com"));
    }

    @Test
    void getExamResult_allowsOrgAdmin() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        activeSession.setScore(10);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(orgAdmin));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(questionRepository.findByExamId(10L)).thenReturn(java.util.List.of());
        when(answerRepository.findBySessionId(55L)).thenReturn(java.util.List.of());
        when(violationRepository.countBySessionId(55L)).thenReturn(0L);
        when(violationRepository.countBySessionIdAndSeverity(55L, ViolationSeverity.CRITICAL)).thenReturn(0L);
        when(assignmentRepository.findByExamIdAndStudentId(10L, 2L)).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.getExamResult(55L, "admin@infosys.com"));
    }
}
