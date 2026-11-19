package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.common.AfterCommit;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.Violation;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Live actions a proctor (or org/super admin) takes on a student's running session.
 * The student's page receives them on {@code /user/queue/session-events}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProctorActionService {

    static final String STUDENT_QUEUE = "/queue/session-events";

    private final ExamSessionRepository   sessionRepository;
    private final UserRepository          userRepository;
    private final ExamProctorService      examProctorService;
    private final ViolationRepository     violationRepository;
    private final ScoreCalculationService scoreCalculationService;
    private final SimpMessagingTemplate   messagingTemplate;

    /** Ends the session now. Recorded as a CRITICAL violation so it shows in the report. */
    @Transactional
    public void terminate(Long sessionId, String reason, String actorEmail) {
        User actor = getUser(actorEmail);
        ExamSession session = getActiveSession(sessionId, actor);

        session.setScore(scoreCalculationService.calculate(session));
        session.setStatus(SessionStatus.TERMINATED);
        session.setEndTime(LocalDateTime.now(ZoneOffset.UTC));
        sessionRepository.save(session);

        Violation termination = Violation.builder()
                .session(session)
                .organization(session.getOrganization())
                .type(ViolationType.OTHER)
                .severity(ViolationSeverity.CRITICAL)
                .details("Terminated by proctor: " + reason)
                .reviewed(true)
                .build();
        violationRepository.save(termination); // persist() assigns the id to this same instance

        log.warn("Session {} terminated by {}: {}", sessionId, actorEmail, reason);
        notifyStudent(session, "SESSION_TERMINATED", "Your exam was ended by the proctor: " + reason);
        AlertMessage alert = AlertMessage.builder()
                .sessionId(session.getId())
                .studentName(session.getStudent().getName())
                .eventType("SESSION_TERMINATED")
                .severity(ViolationSeverity.CRITICAL.name())
                .examTitle(session.getExam().getTitle())
                .violationId(termination.getId())
                .details("Terminated by " + actorEmail + ": " + reason)
                .build();
        AfterCommit.run(() -> messagingTemplate.convertAndSend("/topic/alerts/" + session.getExam().getId(), alert));
    }

    /** Shows a message on the student's exam screen. Nothing is stored. */
    @Transactional(readOnly = true)
    public void warn(Long sessionId, String message, String actorEmail) {
        User actor = getUser(actorEmail);
        ExamSession session = getActiveSession(sessionId, actor);
        notifyStudent(session, "PROCTOR_WARNING", message);
    }

    private void notifyStudent(ExamSession session, String eventType, String details) {
        AlertMessage message = AlertMessage.builder()
                .sessionId(session.getId())
                .studentName(session.getStudent().getName())
                .eventType(eventType)
                .details(details)
                .build();
        AfterCommit.run(() -> messagingTemplate.convertAndSendToUser(
                session.getStudent().getEmail(), STUDENT_QUEUE, message));
    }

    private ExamSession getActiveSession(Long sessionId, User actor) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        validateCanAct(actor, session);
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }
        return session;
    }

    private void validateCanAct(User actor, ExamSession session) {
        if (actor.getRole() == Role.SUPER_ADMIN) return;
        if (actor.getRole() != Role.PROCTOR && actor.getRole() != Role.ORG_ADMIN) {
            throw new UnauthorizedException("Only proctors and admins can act on a live session");
        }
        if (actor.getOrganization() == null || session.getOrganization() == null
                || !actor.getOrganization().getId().equals(session.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        if (actor.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(actor.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
    }
}
