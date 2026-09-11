package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.proctoring.dto.AnalyzeResponse;
import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.GazeResult;
import com.proctor.proctorbackend.proctoring.dto.ObjectDetectionResult;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.ScoreCalculationService;
import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.Violation;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ProctoringServiceImpl}.
 *
 * All external dependencies (repositories, Redis, WebSocket, AI client) are mocked.
 * Tests verify business logic without a Spring context or real infrastructure.
 */
@ExtendWith(MockitoExtension.class)
class ProctoringServiceImplTest {

    // ── Mocks ────────────────────────────────────────────────────────────────

    @Mock ProctoringEventRepository eventRepository;
    @Mock ExamSessionRepository sessionRepository;
    @Mock UserRepository userRepository;
    @Mock AiServiceClient aiServiceClient;
    @Mock SimpMessagingTemplate messagingTemplate;
    @Mock ViolationRepository violationRepository;
    @Mock ExamProctorService examProctorService;
    @Mock ScoreCalculationService scoreCalculationService;
    @Mock StringRedisTemplate stringRedisTemplate;
    @Mock ValueOperations<String, String> valueOps;

    @InjectMocks
    ProctoringServiceImpl service;

    // ── Test fixtures ────────────────────────────────────────────────────────

    Organization org;
    Exam exam;
    User student;
    ExamSession activeSession;

    @BeforeEach
    void setUp() {
        // Inject @Value fields that Mockito cannot inject
        ReflectionTestUtils.setField(service, "criticalThreshold", 5);
        ReflectionTestUtils.setField(service, "dedupIntervalSeconds", 30L);
        ReflectionTestUtils.setField(service, "identityCheckIntervalFrames", 10);

        org = Organization.builder().id(1L).name("TestOrg").slug("testorg").isActive(true).build();
        exam = Exam.builder().id(10L).title("Java Exam").organization(org).durationMinutes(60).build();
        student = User.builder().id(2L).email("student@test.com")
                .name("Test Student")
                .role(com.proctor.proctorbackend.common.enums.Role.STUDENT)
                .organization(org).build();
        activeSession = ExamSession.builder()
                .id(55L).exam(exam).student(student)
                .organization(org).status(SessionStatus.ACTIVE)
                .startTime(LocalDateTime.now().minusMinutes(10))
                .attemptNumber(1).build();

        // Default Redis mock — valueOps returns non-null for increment
        lenient().when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        lenient().when(valueOps.increment(anyString())).thenReturn(1L);
        lenient().when(stringRedisTemplate.hasKey(anyString())).thenReturn(false);
    }

    // -----------------------------------------------------------------------
    // Session validation
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — throws ResourceNotFoundException when session does not exist")
    void processFrame_sessionNotFound_throws() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        FrameUploadRequest req = buildRequest(99L, "frame==");
        assertThrows(ResourceNotFoundException.class,
                () -> service.processFrame(req, "student@test.com"));
    }

    @Test
    @DisplayName("processFrame — throws UnauthorizedException when requester is not session owner")
    void processFrame_notSessionOwner_throws() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        FrameUploadRequest req = buildRequest(55L, "frame==");
        assertThrows(UnauthorizedException.class,
                () -> service.processFrame(req, "hacker@evil.com"));
    }

    @Test
    @DisplayName("processFrame — throws IllegalStateException when session is not ACTIVE")
    void processFrame_sessionNotActive_throws() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        FrameUploadRequest req = buildRequest(55L, "frame==");
        assertThrows(IllegalStateException.class,
                () -> service.processFrame(req, "student@test.com"));
    }

    // -----------------------------------------------------------------------
    // Clean frame (no violations)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — clean frame (no violations) persists FACE_DETECTED event")
    void processFrame_cleanFrame_persistsEventOnly() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        AnalyzeResponse aiResp = buildCleanAnalyzeResponse();
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);

        ProctoringEventResponse response = service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        assertNotNull(response);
        verify(violationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
    }

    // -----------------------------------------------------------------------
    // Violation recording
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — NO_FACE violation is persisted and WebSocket alert is sent")
    void processFrame_noFace_persistsViolationAndSendsAlert() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(0, List.of("no_face"), "HIGH", 15);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.NO_FACE_DETECTED, 0);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        when(violationRepository.countBySessionIdAndSeverity(eq(55L), eq(ViolationSeverity.CRITICAL)))
                .thenReturn(0L);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, times(1)).save(argThat(v ->
                ((Violation) v).getType() == ViolationType.NO_FACE_DETECTED));
        verify(messagingTemplate, times(1)).convertAndSend(
                eq("/topic/alerts/" + exam.getId()), any(AlertMessage.class));
    }

    @Test
    @DisplayName("processFrame — MULTIPLE_FACES violation deduplication skips re-persist within TTL")
    void processFrame_multipleFacesDedup_skipsSecondPersist() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(2, List.of("multiple_faces"), "CRITICAL", 25);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.MULTIPLE_FACES_DETECTED, 2);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        // Simulate dedup key already set (same violation appeared recently)
        when(stringRedisTemplate.hasKey(contains("multiple_faces_detected:55"))).thenReturn(true);
        when(violationRepository.countBySessionIdAndSeverity(eq(55L), eq(ViolationSeverity.CRITICAL)))
                .thenReturn(1L);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        // violation was deduped — save should NOT be called
        verify(violationRepository, never()).save(any());
    }

    @Test
    @DisplayName("processFrame — LOOKING_AWAY is recorded when gaze deviation detected")
    void processFrame_lookingAway_violationPersisted() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(1, List.of("looking_away"), "MEDIUM", 10);
        GazeResult gaze = new GazeResult();
        gaze.setFaceDetected(true);
        gaze.setLookingAway(true);
        gaze.setReason("head_turned");
        aiResp.setGaze(gaze);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        when(violationRepository.countBySessionIdAndSeverity(any(), any())).thenReturn(0L);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, times(1)).save(argThat(v ->
                ((Violation) v).getType() == ViolationType.LOOKING_AWAY));
    }

    @Test
    @DisplayName("processFrame — unknown AI violation string is silently ignored (forward-compat)")
    void processFrame_unknownViolationString_isIgnored() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(1, List.of("unknown_future_violation"), "LOW", 5);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        when(violationRepository.countBySessionIdAndSeverity(any(), any())).thenReturn(0L);

        // Should not throw — unknown violations are logged and skipped
        assertDoesNotThrow(() ->
                service.processFrame(buildRequest(55L, "frame=="), "student@test.com"));
        verify(violationRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // Auto-terminate
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — session is TERMINATED and student notified when CRITICAL threshold reached")
    void processFrame_criticalThresholdReached_terminatesSession() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(0, List.of("no_face"), "HIGH", 15);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.NO_FACE_DETECTED, 0);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        // Critical count AT threshold triggers termination
        when(violationRepository.countBySessionIdAndSeverity(eq(55L), eq(ViolationSeverity.CRITICAL)))
                .thenReturn(5L); // == criticalThreshold
        when(scoreCalculationService.calculate(any())).thenReturn(42);
        when(sessionRepository.save(any())).thenReturn(activeSession);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        // Session should be terminated
        verify(sessionRepository, times(1)).save(argThat(s -> {
            ExamSession sess = (ExamSession) s;
            return sess.getStatus() == SessionStatus.TERMINATED && sess.getScore() == 42;
        }));

        // Student notified via WebSocket /queue/session-events
        verify(messagingTemplate, times(1)).convertAndSendToUser(
                eq("student@test.com"),
                eq("/queue/session-events"),
                any(AlertMessage.class));

        // Examiner alert should NOT fire (early return after termination — BUG-002 fix)
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(AlertMessage.class));
    }

    @Test
    @DisplayName("processFrame — session is NOT terminated below CRITICAL threshold")
    void processFrame_belowCriticalThreshold_doesNotTerminate() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildAnalyzeResponse(0, List.of("no_face"), "HIGH", 15);
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.NO_FACE_DETECTED, 0);
        when(eventRepository.save(any())).thenReturn(savedEvent);
        when(violationRepository.countBySessionIdAndSeverity(eq(55L), eq(ViolationSeverity.CRITICAL)))
                .thenReturn(2L); // below threshold of 5
        when(violationRepository.save(any())).thenReturn(mock(Violation.class));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(sessionRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
    }

    // -----------------------------------------------------------------------
    // Fix #3 — Skip-frame fallback (AI outage must NOT create violations)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — AI outage: no violations recorded, SKIPPED event persisted")
    void processFrame_aiUnavailable_skipsViolationsAndPersistsSkippedEvent() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        // Simulate fallback response (what AiServiceClient returns on error)
        AnalyzeResponse fallback = buildFallbackResponse();
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(fallback);

        ProctoringEvent skippedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 0);
        when(eventRepository.save(any())).thenReturn(skippedEvent);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        // No violations should be persisted during an AI outage
        verify(violationRepository, never()).save(any());

        // A proctoring event IS still saved as an audit trail
        verify(eventRepository, times(1)).save(argThat(e -> {
            ProctoringEvent evt = (ProctoringEvent) e;
            return evt.getDetails() != null
                    && evt.getDetails().contains("AI service unavailable");
        }));

        // No WebSocket alert should be sent
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(Object.class));
        verify(messagingTemplate, never()).convertAndSendToUser(anyString(), anyString(), any());
    }

    // -----------------------------------------------------------------------
    // Fix #2 — Identity check enforcement
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — referenceEmbedding is forwarded to AI client when provided")
    void processFrame_withEmbedding_forwardsEmbeddingToAiClient() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildCleanAnalyzeResponse();
        List<Double> embedding = List.of(0.1, 0.2, 0.3);
        when(aiServiceClient.analyze(eq("frame=="), eq(embedding), isNull())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);

        FrameUploadRequest req = buildRequest(55L, "frame==");
        req.setReferenceEmbedding(embedding);

        service.processFrame(req, "student@test.com");

        // Verify AI client received the embedding
        verify(aiServiceClient, times(1)).analyze("frame==", embedding, null);
    }

    @Test
    @DisplayName("processFrame — null embedding is forwarded when client omits it (identity check deferred)")
    void processFrame_withoutEmbedding_passesNullEmbeddingToAiClient() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildCleanAnalyzeResponse();
        when(aiServiceClient.analyze(eq("frame=="), isNull(), isNull())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);

        // Frame counter at identity-check boundary (frame 10) but NO embedding supplied
        when(valueOps.increment(anyString())).thenReturn(10L);

        FrameUploadRequest req = buildRequest(55L, "frame==");
        // No referenceEmbedding set

        // Should not throw — policy is warn+continue, not reject
        assertDoesNotThrow(() -> service.processFrame(req, "student@test.com"));
        verify(aiServiceClient, times(1)).analyze("frame==", null, null);
    }

    @Test
    @DisplayName("processFrame — frame counter is incremented in Redis on each frame")
    void processFrame_frameCounterIncrementedPerFrame() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        AnalyzeResponse aiResp = buildCleanAnalyzeResponse();
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        // Frame counter must be incremented
        verify(valueOps, times(1)).increment("proctor:frame-count:55");
    }

    @Test
    @DisplayName("processFrame — identity enforcement disabled when interval=0")
    void processFrame_identityEnforcementDisabled_noCounterIncrement() {
        ReflectionTestUtils.setField(service, "identityCheckIntervalFrames", 0);

        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        AnalyzeResponse aiResp = buildCleanAnalyzeResponse();
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(aiResp);

        ProctoringEvent savedEvent = buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1);
        when(eventRepository.save(any())).thenReturn(savedEvent);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        // When interval=0 the counter must NOT be incremented
        verify(valueOps, never()).increment(anyString());
    }

    // -----------------------------------------------------------------------
    // getEventsBySession — access control
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("getEventsBySession — throws UnauthorizedException for different organization")
    void getEventsBySession_differentOrg_throws() {
        Organization otherOrg = Organization.builder().id(99L).name("Other").slug("other").isActive(true).build();
        User otherUser = User.builder().id(10L).email("other@org.com")
                .role(com.proctor.proctorbackend.common.enums.Role.ORG_ADMIN)
                .organization(otherOrg).build();

        when(userRepository.findByEmail("other@org.com")).thenReturn(Optional.of(otherUser));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class,
                () -> service.getEventsBySession(55L, "other@org.com"));
    }

    @Test
    @DisplayName("getEventsBySession — returns events for authorized user in same org")
    void getEventsBySession_sameOrg_returnsEvents() {
        User orgAdmin = User.builder().id(3L).email("admin@testorg.com")
                .role(com.proctor.proctorbackend.common.enums.Role.ORG_ADMIN)
                .organization(org).build();

        when(userRepository.findByEmail("admin@testorg.com")).thenReturn(Optional.of(orgAdmin));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(eventRepository.findBySessionIdOrderByDetectedAtDesc(55L))
                .thenReturn(List.of(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1)));

        List<ProctoringEventResponse> events = service.getEventsBySession(55L, "admin@testorg.com");

        assertNotNull(events);
        assertEquals(1, events.size());
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private FrameUploadRequest buildRequest(Long sessionId, String frame) {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(sessionId);
        req.setFrameBase64(frame);
        return req;
    }

    private AnalyzeResponse buildCleanAnalyzeResponse() {
        return buildAnalyzeResponse(1, Collections.emptyList(), "NONE", 0);
    }

    private AnalyzeResponse buildAnalyzeResponse(int faceCount, List<String> violations,
                                                  String severityLevel, int severityScore) {
        FaceInferenceResult face = new FaceInferenceResult();
        face.setFaceCount(faceCount);
        face.setFaces(Collections.emptyList());

        GazeResult gaze = new GazeResult();
        gaze.setFaceDetected(faceCount > 0);
        gaze.setLookingAway(false);

        ObjectDetectionResult objects = new ObjectDetectionResult();
        objects.setObjects(Collections.emptyList());
        objects.setUnauthorizedObjects(Collections.emptyList());
        objects.setFlagged(false);

        AnalyzeResponse resp = new AnalyzeResponse();
        resp.setFace(face);
        resp.setGaze(gaze);
        resp.setObjects(objects);
        resp.setViolations(violations);
        resp.setSeverityLevel(severityLevel);
        resp.setSeverityScore(severityScore);
        return resp;
    }

    /** Returns the fallback AnalyzeResponse as produced by AiServiceClient on AI outage. */
    private AnalyzeResponse buildFallbackResponse() {
        FaceInferenceResult face = new FaceInferenceResult();
        face.setFaceCount(0);
        face.setFaces(Collections.emptyList());

        GazeResult gaze = new GazeResult();
        gaze.setFaceDetected(false);
        gaze.setLookingAway(false);
        gaze.setReason("ai_service_unavailable"); // sentinel

        ObjectDetectionResult objects = new ObjectDetectionResult();
        objects.setObjects(Collections.emptyList());
        objects.setUnauthorizedObjects(Collections.emptyList());
        objects.setFlagged(false);

        AnalyzeResponse fallback = new AnalyzeResponse();
        fallback.setFace(face);
        fallback.setGaze(gaze);
        fallback.setObjects(objects);
        fallback.setViolations(Collections.emptyList()); // Fix #3: empty, not ["no_face"]
        fallback.setSeverityScore(0);
        fallback.setSeverityLevel("NONE");
        return fallback;
    }

    private ProctoringEvent buildEvent(ProctoringEvent.EventType type, int faceCount) {
        return ProctoringEvent.builder()
                .id(1L)
                .session(activeSession)
                .eventType(type)
                .details("test")
                .faceCount(faceCount)
                .build();
    }
}
