package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Core proctoring business logic.
 *
 * <p>Receives webcam frames from students, calls the Python AI service for
 * face detection, persists {@link ProctoringEvent} records, and pushes
 * real-time {@link com.proctor.proctorbackend.websocket.dto.AlertMessage} alerts
 * to examiners over WebSocket when violations are detected.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProctoringServiceImpl implements ProctoringService {

    private final ProctoringEventRepository eventRepository;
    private final ExamSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final AiServiceClient aiServiceClient;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Processes a single webcam frame submitted by a student.
     *
     * <p>Steps:
     * <ol>
     *   <li>Load and validate the {@link com.proctor.proctorbackend.session.ExamSession}.</li>
     *   <li>Verify the requesting student owns the session.</li>
     *   <li>Ensure the session is still {@code ACTIVE}.</li>
     *   <li>Forward the base64 frame to the AI service and get a face count.</li>
     *   <li>Map face count → {@link ProctoringEvent.EventType}.</li>
     *   <li>Persist the event to the database.</li>
     *   <li>If a violation occurred, push a WebSocket alert to {@code /topic/alerts/{examId}}.</li>
     * </ol>
     *
     * @param request      the frame upload payload containing sessionId and base64 image
     * @param studentEmail the email of the authenticated student submitting the frame
     * @return a {@link ProctoringEventResponse} describing the detected event
     * @throws com.proctor.proctorbackend.common.exception.ResourceNotFoundException
     *         if the session does not exist
     * @throws com.proctor.proctorbackend.common.exception.UnauthorizedException
     *         if the caller does not own the session
     * @throws IllegalStateException if the session is not in ACTIVE status
     */
    @Override
    @Transactional
    public ProctoringEventResponse processFrame(FrameUploadRequest request, String studentEmail) {
        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", request.getSessionId()));

        // Validate that the requesting student owns this session
        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You do not own this session");
        }

        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }

        // Call AI service for face detection
        FaceInferenceResult result = aiServiceClient.inferFace(request.getFrameBase64());

        // Determine event type based on face count
        ProctoringEvent.EventType eventType;
        String details;

        if (result.getFaceCount() == 0) {
            eventType = ProctoringEvent.EventType.NO_FACE_DETECTED;
            details = "No face detected in frame";
        } else if (result.getFaceCount() > 1) {
            eventType = ProctoringEvent.EventType.MULTIPLE_FACES_DETECTED;
            details = result.getFaceCount() + " faces detected in frame";
        } else {
            eventType = ProctoringEvent.EventType.FACE_DETECTED;
            details = "Normal — 1 face detected";
        }

        // Persist the event
        ProctoringEvent event = ProctoringEvent.builder()
                .session(session)
                .eventType(eventType)
                .details(details)
                .faceCount(result.getFaceCount())
                .build();

        ProctoringEvent saved = eventRepository.save(event);

        // Push real-time alert to examiner for violations only
        if (eventType != ProctoringEvent.EventType.FACE_DETECTED) {
            AlertMessage alert = AlertMessage.builder()
                    .sessionId(session.getId())
                    .studentName(session.getStudent().getName())
                    .eventType(eventType.name())
                    .details(details)
                    .build();
            messagingTemplate.convertAndSend(
                    "/topic/alerts/" + session.getExam().getId(), alert);
            log.warn("Proctoring alert: session={}, event={}", session.getId(), eventType);
        }

        return toResponse(saved);
    }

    /**
     * Retrieves all proctoring events for a given session, ordered newest first.
     *
     * @param sessionId the ID of the exam session
     * @return list of {@link ProctoringEventResponse} DTOs
     */
    @Override
    public List<ProctoringEventResponse> getEventsBySession(Long sessionId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        validateSameOrganization(requester, session);
        return eventRepository.findBySessionIdOrderByDetectedAtDesc(sessionId)
                .stream().map(this::toResponse).toList();
    }

    private void validateSameOrganization(User user, ExamSession session) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (user.getOrganization() == null || session.getOrganization() == null
                || !user.getOrganization().getId().equals(session.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
    }

    /**
     * Maps a {@link ProctoringEvent} entity to its response DTO.
     *
     * @param event the entity to map
     * @return the corresponding {@link ProctoringEventResponse}
     */
    private ProctoringEventResponse toResponse(ProctoringEvent event) {
        return ProctoringEventResponse.builder()
                .id(event.getId())
                .sessionId(event.getSession().getId())
                .eventType(event.getEventType())
                .details(event.getDetails())
                .faceCount(event.getFaceCount())
                .detectedAt(event.getDetectedAt())
                .build();
    }
}
