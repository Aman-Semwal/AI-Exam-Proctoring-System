package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.proctoring.dto.AnalyzeResponse;
import com.proctor.proctorbackend.proctoring.dto.BrowserEventResponse;
import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.GazeResult;
import com.proctor.proctorbackend.proctoring.dto.ObjectDetectionResult;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import com.proctor.proctorbackend.proctoring.dto.VoiceActivityResult;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.ScoreCalculationService;
import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.violation.Violation;
import com.proctor.proctorbackend.violation.ViolationEvidence;
import com.proctor.proctorbackend.violation.ViolationEvidenceRepository;
import com.proctor.proctorbackend.violation.ViolationRepository;
import com.proctor.proctorbackend.violation.ViolationSeverity;
import com.proctor.proctorbackend.violation.ViolationType;
import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
    @Mock ViolationEvidenceRepository evidenceRepository;

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
        ReflectionTestUtils.setField(service, "speechFractionThreshold", 0.3);

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
    @DisplayName("processFrame — stored session embedding is sent on identity-check frames")
    void processFrame_identityDue_sendsStoredEmbedding() {
        List<Double> stored = List.of(0.1, 0.2, 0.3);
        activeSession.setReferenceEmbedding(stored);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(valueOps.increment(anyString())).thenReturn(10L);

        when(aiServiceClient.analyze(eq("frame=="), eq(stored), isNull()))
                .thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(aiServiceClient, times(1)).analyze("frame==", stored, null);
    }

    @Test
    @DisplayName("processFrame — no embedding is sent on frames between identity checks")
    void processFrame_identityNotDue_sendsNoEmbedding() {
        activeSession.setReferenceEmbedding(List.of(0.1, 0.2, 0.3));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(valueOps.increment(anyString())).thenReturn(3L);

        when(aiServiceClient.analyze(eq("frame=="), isNull(), isNull()))
                .thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(aiServiceClient, times(1)).analyze("frame==", null, null);
    }

    @Test
    @DisplayName("processFrame — identity check due but session not enrolled: null embedding, no throw")
    void processFrame_identityDue_noStoredEmbedding_passesNull() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(valueOps.increment(anyString())).thenReturn(10L);

        when(aiServiceClient.analyze(eq("frame=="), isNull(), isNull()))
                .thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        assertDoesNotThrow(() -> service.processFrame(buildRequest(55L, "frame=="), "student@test.com"));
        verify(aiServiceClient, times(1)).analyze("frame==", null, null);
    }

    // -----------------------------------------------------------------------
    // recordBrowserEvent — tab switch / fullscreen exit
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("recordBrowserEvent — TAB_SWITCH persisted as HIGH and alert broadcast")
    void recordBrowserEvent_tabSwitch_persistsHighAndAlerts() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com");

        verify(violationRepository).save(argThat(v ->
                v.getType() == ViolationType.TAB_SWITCH
                        && v.getSeverity() == ViolationSeverity.HIGH
                        && v.getOrganization() == org
                        && Boolean.FALSE.equals(v.getReviewed())));
        verify(messagingTemplate).convertAndSend(
                eq("/topic/alerts/" + exam.getId()),
                argThat((AlertMessage m) -> "TAB_SWITCH".equals(m.getEventType())));
    }

    @Test
    @DisplayName("recordBrowserEvent — first TAB_SWITCH does not auto-submit")
    void recordBrowserEvent_firstTabSwitch_doesNotSubmit() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(violationRepository.countBySessionIdAndType(55L, ViolationType.TAB_SWITCH)).thenReturn(1L);

        BrowserEventResponse resp =
                service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com");

        assertFalse(resp.isAutoSubmitted());
        assertEquals(1L, resp.getTabSwitchCount());
        assertEquals(SessionStatus.ACTIVE, activeSession.getStatus());
        verify(scoreCalculationService, never()).calculate(any());
    }

    @Test
    @DisplayName("recordBrowserEvent — TAB_SWITCH at threshold auto-submits the session (COMPLETED + score)")
    void recordBrowserEvent_tabSwitchThreshold_autoSubmits() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(violationRepository.countBySessionIdAndType(55L, ViolationType.TAB_SWITCH)).thenReturn(2L);
        when(scoreCalculationService.calculate(activeSession)).thenReturn(42);

        BrowserEventResponse resp =
                service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com");

        assertTrue(resp.isAutoSubmitted());
        assertEquals(SessionStatus.COMPLETED, activeSession.getStatus());
        assertEquals(42, activeSession.getScore());
        assertNotNull(activeSession.getEndTime());
        verify(sessionRepository).save(activeSession);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/alerts/" + exam.getId()),
                argThat((AlertMessage m) -> "SESSION_AUTO_SUBMITTED".equals(m.getEventType())));
    }

    @Test
    @DisplayName("recordBrowserEvent — FULLSCREEN_EXIT persisted as MEDIUM and never auto-submits")
    void recordBrowserEvent_fullscreenExit_persistsMedium() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        BrowserEventResponse resp =
                service.recordBrowserEvent(55L, ViolationType.FULLSCREEN_EXIT, "student@test.com");

        verify(violationRepository).save(argThat(v ->
                v.getType() == ViolationType.FULLSCREEN_EXIT
                        && v.getSeverity() == ViolationSeverity.MEDIUM));
        assertFalse(resp.isAutoSubmitted());
        assertEquals(SessionStatus.ACTIVE, activeSession.getStatus());
    }

    @Test
    @DisplayName("recordBrowserEvent — non-browser types (e.g. AI types) are rejected")
    void recordBrowserEvent_aiType_throwsBadRequest() {
        assertThrows(BadRequestException.class,
                () -> service.recordBrowserEvent(55L, ViolationType.IDENTITY_MISMATCH, "student@test.com"));
        verify(violationRepository, never()).save(any());
    }

    @Test
    @DisplayName("recordBrowserEvent — non-owner is rejected")
    void recordBrowserEvent_notOwner_throwsUnauthorized() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class,
                () -> service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "hacker@evil.com"));
        verify(violationRepository, never()).save(any());
    }

    @Test
    @DisplayName("recordBrowserEvent — inactive session is rejected")
    void recordBrowserEvent_sessionNotActive_throwsIllegalState() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(IllegalStateException.class,
                () -> service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com"));
        verify(violationRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // Per-exam proctoring rules
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("rules — gaze tracking disabled: LOOKING_AWAY is not recorded")
    void rules_gazeDisabled_lookingAwayIgnored() {
        exam.getProctoringRules().setGazeTrackingEnabled(false);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(1, List.of("looking_away"), "MEDIUM", 10));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, never()).save(any());
        verify(messagingTemplate, never()).convertAndSend(anyString(), any(AlertMessage.class));
    }

    @Test
    @DisplayName("rules — object detection disabled: UNAUTHORIZED_OBJECT is not recorded")
    void rules_objectDetectionDisabled_objectIgnored() {
        exam.getProctoringRules().setObjectDetectionEnabled(false);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(1, List.of("unauthorized_object"), "CRITICAL", 30));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, never()).save(any());
    }

    @Test
    @DisplayName("rules — identity check disabled: stored embedding is never sent")
    void rules_identityDisabled_noEmbeddingSent() {
        exam.getProctoringRules().setIdentityCheckEnabled(false);
        activeSession.setReferenceEmbedding(List.of(0.1, 0.2));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(eq("frame=="), isNull(), isNull())).thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(aiServiceClient).analyze("frame==", null, null);
    }

    @Test
    @DisplayName("rules — exam tab switch limit is used for auto-submit")
    void rules_tabSwitchLimitFromExam() {
        exam.getProctoringRules().setTabSwitchLimit(3);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(violationRepository.countBySessionIdAndType(55L, ViolationType.TAB_SWITCH)).thenReturn(2L);

        assertFalse(service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com").isAutoSubmitted());
    }

    @Test
    @DisplayName("rules — tab switch limit 0 never auto-submits")
    void rules_tabSwitchLimitZero_neverSubmits() {
        exam.getProctoringRules().setTabSwitchLimit(0);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(violationRepository.countBySessionIdAndType(55L, ViolationType.TAB_SWITCH)).thenReturn(10L);

        assertFalse(service.recordBrowserEvent(55L, ViolationType.TAB_SWITCH, "student@test.com").isAutoSubmitted());
        assertEquals(SessionStatus.ACTIVE, activeSession.getStatus());
    }

    // -----------------------------------------------------------------------
    // Audio monitoring → SPEECH_DETECTED
    // -----------------------------------------------------------------------

    private AnalyzeResponse withSpeech(boolean detected, double fraction) {
        AnalyzeResponse resp = buildCleanAnalyzeResponse();
        VoiceActivityResult voice = new VoiceActivityResult();
        voice.setSpeechDetected(detected);
        voice.setSpeechFraction(fraction);
        resp.setVoiceActivity(voice);
        return resp;
    }

    @Test
    @DisplayName("audio — audio chunk is forwarded to the AI service when monitoring is on")
    void audio_forwardedWhenEnabled() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(eq("frame=="), isNull(), eq("wav=="))).thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        FrameUploadRequest req = buildRequest(55L, "frame==");
        req.setAudioBase64("wav==");
        service.processFrame(req, "student@test.com");

        verify(aiServiceClient).analyze("frame==", null, "wav==");
    }

    @Test
    @DisplayName("audio — audio chunk is dropped when the exam disables audio monitoring")
    void audio_droppedWhenDisabled() {
        exam.getProctoringRules().setAudioMonitoringEnabled(false);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(eq("frame=="), isNull(), isNull())).thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        FrameUploadRequest req = buildRequest(55L, "frame==");
        req.setAudioBase64("wav==");
        service.processFrame(req, "student@test.com");

        verify(aiServiceClient).analyze("frame==", null, null);
    }

    @Test
    @DisplayName("audio — sustained speech records a MEDIUM SPEECH_DETECTED violation and alerts")
    void audio_speechAboveThreshold_recordsViolation() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(withSpeech(true, 0.6));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository).save(argThat(v ->
                v.getType() == ViolationType.SPEECH_DETECTED && v.getSeverity() == ViolationSeverity.MEDIUM));
        verify(messagingTemplate).convertAndSend(eq("/topic/alerts/" + exam.getId()), any(AlertMessage.class));
    }

    @Test
    @DisplayName("audio — brief speech below the fraction threshold is ignored")
    void audio_speechBelowThreshold_ignored() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(withSpeech(true, 0.1));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, never()).save(any());
    }

    @Test
    @DisplayName("audio — SPEECH_DETECTED is deduplicated within the Redis window")
    void audio_speechDeduplicated() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(withSpeech(true, 0.9));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));
        when(stringRedisTemplate.hasKey("proctor:dedupe:speech_detected:55")).thenReturn(true);

        service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        verify(violationRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // Frame response tells the student's client what was just detected
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("processFrame — response lists the violations detected in this frame")
    void processFrame_responseListsViolations() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(1, List.of("looking_away"), "MEDIUM", 10));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        ProctoringEventResponse resp = service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        assertEquals(List.of("looking_away"), resp.getViolationsDetected());
        assertEquals(SessionStatus.ACTIVE, resp.getSessionStatus());
    }

    @Test
    @DisplayName("processFrame — clean frame returns an empty violation list")
    void processFrame_cleanFrame_emptyViolations() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any())).thenReturn(buildCleanAnalyzeResponse());
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));

        ProctoringEventResponse resp = service.processFrame(buildRequest(55L, "frame=="), "student@test.com");

        assertTrue(resp.getViolationsDetected().isEmpty());
    }

    // -----------------------------------------------------------------------
    // Evidence snapshots
    // -----------------------------------------------------------------------

    private static final String JPEG_B64 = java.util.Base64.getEncoder().encodeToString(new byte[]{1, 2, 3});

    @Test
    @DisplayName("evidence — the frame is stored as evidence for each recorded AI violation")
    void evidence_savedForRecordedViolation() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(0, List.of("no_face"), "HIGH", 15));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.NO_FACE_DETECTED, 0));

        service.processFrame(buildRequest(55L, JPEG_B64), "student@test.com");

        verify(evidenceRepository).save(argThat((ViolationEvidence e) ->
                java.util.Arrays.equals(new byte[]{1, 2, 3}, e.getData())
                        && "image/jpeg".equals(e.getContentType())
                        && e.getViolation().getType() == ViolationType.NO_FACE_DETECTED));
    }

    @Test
    @DisplayName("evidence — nothing is stored when the violation was deduplicated")
    void evidence_notSavedWhenDeduplicated() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(1, List.of("looking_away"), "MEDIUM", 10));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.FACE_DETECTED, 1));
        when(stringRedisTemplate.hasKey("proctor:dedupe:looking_away:55")).thenReturn(true);

        service.processFrame(buildRequest(55L, JPEG_B64), "student@test.com");

        verify(evidenceRepository, never()).save(any());
    }

    @Test
    @DisplayName("evidence — an undecodable frame skips evidence but still records the violation")
    void evidence_badBase64_skippedViolationKept() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.analyze(anyString(), any(), any()))
                .thenReturn(buildAnalyzeResponse(0, List.of("no_face"), "HIGH", 15));
        when(eventRepository.save(any())).thenReturn(buildEvent(ProctoringEvent.EventType.NO_FACE_DETECTED, 0));

        service.processFrame(buildRequest(55L, "not base64 !!"), "student@test.com");

        verify(violationRepository).save(any());
        verify(evidenceRepository, never()).save(any());
    }

    // -----------------------------------------------------------------------
    // getMyViolationCount — student's own live warning count
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("getMyViolationCount — owner gets the session's violation count")
    void getMyViolationCount_owner_returnsCount() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(violationRepository.countBySessionId(55L)).thenReturn(4L);

        assertEquals(4L, service.getMyViolationCount(55L, "student@test.com"));
    }

    @Test
    @DisplayName("getMyViolationCount — another student is rejected")
    void getMyViolationCount_notOwner_throws() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class,
                () -> service.getMyViolationCount(55L, "hacker@evil.com"));
    }

    // -----------------------------------------------------------------------
    // enrollReference — per-session live reference photo
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("enrollReference — stores the AI embedding on the session")
    void enrollReference_success_storesEmbedding() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        List<Double> embedding = List.of(0.5, 0.6);
        when(aiServiceClient.embed("photo==")).thenReturn(embedding);

        service.enrollReference(55L, "photo==", "student@test.com");

        assertEquals(embedding, activeSession.getReferenceEmbedding());
        verify(sessionRepository).save(activeSession);
    }

    @Test
    @DisplayName("enrollReference — no face in photo throws BadRequestException and stores nothing")
    void enrollReference_noFace_throwsBadRequest() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));
        when(aiServiceClient.embed("photo==")).thenReturn(null);

        assertThrows(BadRequestException.class,
                () -> service.enrollReference(55L, "photo==", "student@test.com"));
        assertNull(activeSession.getReferenceEmbedding());
        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("enrollReference — already-enrolled session cannot be re-enrolled")
    void enrollReference_alreadyEnrolled_throwsIllegalState() {
        activeSession.setReferenceEmbedding(List.of(0.1));
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(IllegalStateException.class,
                () -> service.enrollReference(55L, "photo==", "student@test.com"));
        verify(aiServiceClient, never()).embed(anyString());
    }

    @Test
    @DisplayName("enrollReference — non-owner is rejected")
    void enrollReference_notOwner_throwsUnauthorized() {
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(UnauthorizedException.class,
                () -> service.enrollReference(55L, "photo==", "hacker@evil.com"));
        verify(aiServiceClient, never()).embed(anyString());
    }

    @Test
    @DisplayName("enrollReference — inactive session is rejected")
    void enrollReference_sessionNotActive_throwsIllegalState() {
        activeSession.setStatus(SessionStatus.COMPLETED);
        when(sessionRepository.findById(55L)).thenReturn(Optional.of(activeSession));

        assertThrows(IllegalStateException.class,
                () -> service.enrollReference(55L, "photo==", "student@test.com"));
        verify(aiServiceClient, never()).embed(anyString());
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
