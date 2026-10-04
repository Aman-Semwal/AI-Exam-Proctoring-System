package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.ProctoringRules;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.proctoring.dto.AnalyzeResponse;
import com.proctor.proctorbackend.proctoring.dto.BrowserEventResponse;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

/**
 * Core proctoring business logic.
 *
 * <h3>What changed from the previous version</h3>
 * <p>The service previously called {@code /infer/face} and derived violations solely
 * from the raw face count (0 = NO_FACE, >1 = MULTIPLE_FACES, 1 = ok). The full
 * proctoring pipeline — gaze deviation, unauthorized objects, identity mismatch —
 * was silently inactive.
 *
 * <p>This version calls {@code /infer/analyze} via {@link AiServiceClient#analyze},
 * which runs all four detectors in a single round trip and returns a structured
 * violation list. Each string violation from the AI is mapped to the corresponding
 * {@link ViolationType} enum value and persisted as a {@link Violation} record.
 * Severity is derived from the AI's own severity score rather than being hard-coded
 * per event type.
 *
 * <h3>Violation dedup (Redis TTL — BUG-010)</h3>
 * <p>MULTIPLE_FACES and LOOKING_AWAY violations are deduplicated with a Redis TTL key
 * so a single sustained event doesn't spam the violation table. NO_FACE and
 * UNAUTHORIZED_OBJECT are NOT deduplicated — each frame detection is recorded
 * (NO_FACE: camera may recover, each absence is independently meaningful;
 * UNAUTHORIZED_OBJECT: rare event, worth recording every occurrence).
 *
 * <h3>Auto-terminate (BUG-002, BUG-006)</h3>
 * <p>Session auto-termination uses {@link ScoreCalculationService} (track-aware).
 * After termination the method returns immediately — no double alert.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProctoringServiceImpl implements ProctoringService {

    private final ProctoringEventRepository eventRepository;
    private final ExamSessionRepository     sessionRepository;
    private final UserRepository            userRepository;
    private final AiServiceClient           aiServiceClient;
    private final SimpMessagingTemplate     messagingTemplate;
    private final ViolationRepository       violationRepository;
    private final ExamProctorService        examProctorService;
    private final ScoreCalculationService   scoreCalculationService;
    private final StringRedisTemplate       stringRedisTemplate;
    private final ViolationEvidenceRepository evidenceRepository;

    /** Violation string the backend adds itself (the AI service never emits it). */
    private static final String SPEECH_VIOLATION = "speech_detected";

    /** Redis key prefix for violation deduplication. */
    private static final String DEDUP_PREFIX = "proctor:dedupe:";

    /** Redis key prefix for per-session frame counters (identity enforcement). */
    private static final String FRAME_COUNTER_PREFIX = "proctor:frame-count:";

    /** CRITICAL violation count threshold for auto-terminating a session. */
    @Value("${proctoring.violation.critical-threshold:5}")
    private int criticalThreshold;

    /**
     * Minimum seconds between persisted MULTIPLE_FACES / LOOKING_AWAY violations
     * for the same session. Controls Redis key TTL.
     */
    @Value("${proctoring.violation.multiple-faces.min-interval-seconds:30}")
    private long dedupIntervalSeconds;

    /**
     * Minimum frame interval at which identity verification must be performed.
     * If a frame landing on this boundary arrives without a reference embedding,
     * the frame is still processed (no false violation) but a warning is logged —
     * the enforcement here is that the backend actively requests identity checks
     * by passing the embedding through when the client provides one, and logs
     * when it cannot because the embedding is absent.
     * Set to 0 to disable enforcement.
     */
    @Value("${proctoring.identity.check-interval-frames:10}")
    private int identityCheckIntervalFrames;

    /** Minimum share of a chunk classified as speech before it counts as SPEECH_DETECTED. */
    @Value("${proctoring.audio.speech-fraction-threshold:0.3}")
    private double speechFractionThreshold;

    // -----------------------------------------------------------------------
    // AI violation string → Java enum + severity
    // -----------------------------------------------------------------------

    /**
     * Maps the AI service's lowercase violation string to the Java {@link ViolationType}.
     * Returns {@code null} for any unknown string (forward-compatible — new AI violation
     * types won't crash the backend).
     *
     * <p>AI strings (from {@code app/models/analysis.py Violation} enum):
     * <pre>
     *   "no_face"             → NO_FACE_DETECTED
     *   "multiple_faces"      → MULTIPLE_FACES_DETECTED
     *   "looking_away"        → LOOKING_AWAY
     *   "unauthorized_object" → UNAUTHORIZED_OBJECT
     *   "identity_mismatch"   → IDENTITY_MISMATCH
     * </pre>
     */
    private static ViolationType mapAiViolation(String aiViolation) {
        return switch (aiViolation) {
            case "no_face"             -> ViolationType.NO_FACE_DETECTED;
            case "multiple_faces"      -> ViolationType.MULTIPLE_FACES_DETECTED;
            case "looking_away"        -> ViolationType.LOOKING_AWAY;
            case "unauthorized_object" -> ViolationType.UNAUTHORIZED_OBJECT;
            case "identity_mismatch"   -> ViolationType.IDENTITY_MISMATCH;
            case SPEECH_VIOLATION      -> ViolationType.SPEECH_DETECTED;
            default -> {
                // Unknown violation string from AI — log and skip rather than crash
                log.warn("Unrecognised AI violation type: '{}'", aiViolation);
                yield null;
            }
        };
    }

    /**
     * Derives {@link ViolationSeverity} from the AI's per-violation contribution
     * to the aggregate severity score.
     *
     * <p>Point values mirror {@code analysis_service._VIOLATION_POINTS}:
     * <pre>
     *   no_face             → 15 pts → HIGH
     *   multiple_faces      → 25 pts → CRITICAL
     *   looking_away        → 10 pts → MEDIUM
     *   unauthorized_object → 30 pts → CRITICAL
     *   identity_mismatch   → 40 pts → CRITICAL
     * </pre>
     */
    private static ViolationSeverity severityFor(ViolationType type) {
        return switch (type) {
            case NO_FACE_DETECTED       -> ViolationSeverity.HIGH;
            case MULTIPLE_FACES_DETECTED -> ViolationSeverity.CRITICAL;
            case LOOKING_AWAY           -> ViolationSeverity.MEDIUM;
            case UNAUTHORIZED_OBJECT    -> ViolationSeverity.CRITICAL;
            case IDENTITY_MISMATCH      -> ViolationSeverity.CRITICAL;
            case SPEECH_DETECTED        -> ViolationSeverity.MEDIUM;
            default                     -> ViolationSeverity.LOW;
        };
    }

    /** Whether the exam's rules want this AI violation type recorded. */
    private static boolean isEnabled(ViolationType type, ProctoringRules rules) {
        if (type == null) return true; // unknown strings are logged and skipped later
        return switch (type) {
            case LOOKING_AWAY        -> rules.isGazeTrackingEnabled();
            case UNAUTHORIZED_OBJECT -> rules.isObjectDetectionEnabled();
            case IDENTITY_MISMATCH   -> rules.isIdentityCheckEnabled();
            default                  -> true;
        };
    }

    /**
     * Types that are deduplicated within {@link #dedupIntervalSeconds} to prevent
     * a sustained event flooding the violation table.
     * NO_FACE and UNAUTHORIZED_OBJECT are NOT deduplicated (see class Javadoc).
     */
    private static boolean shouldDedup(ViolationType type) {
        return type == ViolationType.MULTIPLE_FACES_DETECTED
                || type == ViolationType.LOOKING_AWAY
                || type == ViolationType.SPEECH_DETECTED;
    }

    // -----------------------------------------------------------------------
    // processFrame
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public ProctoringEventResponse processFrame(FrameUploadRequest request, String studentEmail) {

        ExamSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", request.getSessionId()));

        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You do not own this session");
        }
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }

        // ── Identity check every N frames ────────────────────────────────────
        // The reference embedding comes only from the server-side enrollment
        // (enrollReference) — never from the client, which could otherwise send
        // its own embedding and pass every check.
        ProctoringRules rules = session.getExam().getProctoringRules();
        List<Double> embeddingToSend = null;
        if (identityCheckIntervalFrames > 0 && rules.isIdentityCheckEnabled()) {
            String counterKey = FRAME_COUNTER_PREFIX + session.getId();
            Long frameCount = stringRedisTemplate.opsForValue().increment(counterKey);
            // Set a generous TTL so the counter expires if the session goes idle
            if (frameCount != null && frameCount == 1L) {
                stringRedisTemplate.expire(counterKey, Duration.ofHours(12));
            }
            boolean identityDue = (frameCount != null) && (frameCount % identityCheckIntervalFrames == 0);
            if (identityDue) {
                embeddingToSend = session.getReferenceEmbedding();
                if (embeddingToSend == null) {
                    // Warn, don't punish: a missing enrollment is not evidence of cheating.
                    log.warn("Identity check due at frame {} for session {} but no reference "
                            + "photo is enrolled — identity cannot be verified for this frame.",
                            frameCount, session.getId());
                }
            }
        }

        // ── Call AI service (/infer/analyze) ────────────────────────────────
        // Pass the reference embedding when due so the AI service runs
        // identity verification in the same round trip.
        String audioToSend = rules.isAudioMonitoringEnabled() ? request.getAudioBase64() : null;
        AnalyzeResponse ai = aiServiceClient.analyze(request.getFrameBase64(), embeddingToSend, audioToSend);

        // ── Skip-frame fallback (Fix #3) ─────────────────────────────────────
        // AiServiceClient.analyze() returns null when the AI service is
        // unreachable AND the fallback itself fails. More importantly, the
        // fallback AnalyzeResponse now returns an EMPTY violations list so that
        // an outage never synthesises a NO_FACE violation.
        // If we get back a flagged response with violations=[...] containing
        // "no_face" AND gaze.reason=="ai_service_unavailable" it means the
        // fallback fired — we skip recording any violations for this frame.
        boolean aiUnavailable = ai != null
                && ai.getGaze() != null
                && "ai_service_unavailable".equals(ai.getGaze().getReason());
        if (ai == null || aiUnavailable) {
            log.warn("AI service unavailable for session {} — skipping proctoring for this frame.",
                    session.getId());
            // Persist a lightweight SKIPPED event so there is an audit trail.
            ProctoringEvent skipped = ProctoringEvent.builder()
                    .session(session)
                    .eventType(ProctoringEvent.EventType.FACE_DETECTED) // neutral
                    .details("Frame skipped — AI service unavailable")
                    .faceCount(0)
                    .build();
            return toResponse(eventRepository.save(skipped));
        }

        int faceCount = (ai.getFace() != null) ? ai.getFace().getFaceCount() : 0;

        // Derive proctoring event type from face count (kept for the ProctoringEvent record)
        ProctoringEvent.EventType eventType;
        if      (faceCount == 0) eventType = ProctoringEvent.EventType.NO_FACE_DETECTED;
        else if (faceCount > 1)  eventType = ProctoringEvent.EventType.MULTIPLE_FACES_DETECTED;
        else                     eventType = ProctoringEvent.EventType.FACE_DETECTED;

        String eventDetails = buildEventDetails(faceCount, ai);

        // ── Persist proctoring event ─────────────────────────────────────────
        ProctoringEvent event = ProctoringEvent.builder()
                .session(session)
                .eventType(eventType)
                .details(eventDetails)
                .faceCount(faceCount)
                .build();
        ProctoringEvent saved = eventRepository.save(event);

        // ── No violations — clean frame ──────────────────────────────────────
        // Checks the exam has switched off are dropped here (the AI runs every detector)
        List<String> aiViolations = (ai.getViolations() != null ? ai.getViolations() : List.<String>of())
                .stream()
                .filter(v -> isEnabled(mapAiViolation(v), rules))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));
        // The AI reports voice activity but leaves the "is this cheating" call to us:
        // only sustained speech (not a cough) becomes a violation
        if (ai.getVoiceActivity() != null
                && ai.getVoiceActivity().isSpeechDetected()
                && ai.getVoiceActivity().getSpeechFraction() >= speechFractionThreshold) {
            aiViolations.add(SPEECH_VIOLATION);
        }
        if (aiViolations.isEmpty()) {
            return toResponse(saved, aiViolations, session.getStatus());
        }

        // ── Map and persist violations ───────────────────────────────────────
        List<ViolationType> persistedTypes = new ArrayList<>();

        for (String aiViolationStr : aiViolations) {
            ViolationType javaType = mapAiViolation(aiViolationStr);
            if (javaType == null) continue;

            // Redis dedup check for noisy repeated violations
            if (shouldDedup(javaType)) {
                String dedupKey = DEDUP_PREFIX + javaType.name().toLowerCase() + ":" + session.getId();
                if (Boolean.TRUE.equals(stringRedisTemplate.hasKey(dedupKey))) {
                    // Already recorded recently — skip persistence but still alert
                    persistedTypes.add(javaType);
                    continue;
                }
                stringRedisTemplate.opsForValue().set(
                        dedupKey, "1", Duration.ofSeconds(dedupIntervalSeconds));
            }

            Violation violation = Violation.builder()
                    .session(session)
                    .organization(session.getOrganization())
                    .type(javaType)
                    .severity(severityFor(javaType))
                    .details(buildViolationDetail(javaType, ai))
                    .reviewed(false)
                    .build();
            violationRepository.save(violation);
            saveEvidence(violation, request.getFrameBase64());
            persistedTypes.add(javaType);
        }

        // ── Auto-terminate on CRITICAL threshold ─────────────────────────────
        long criticalCount = violationRepository
                .countBySessionIdAndSeverity(session.getId(), ViolationSeverity.CRITICAL);

        if (criticalCount >= criticalThreshold) {
            session.setScore(scoreCalculationService.calculate(session));
            session.setStatus(SessionStatus.TERMINATED);
            session.setEndTime(LocalDateTime.now(ZoneId.of("UTC")));
            sessionRepository.save(session);

            log.warn("Session {} auto-terminated after {} CRITICAL violations",
                    session.getId(), criticalCount);

            messagingTemplate.convertAndSendToUser(
                    session.getStudent().getEmail(),
                    "/queue/session-events",
                    AlertMessage.builder()
                            .sessionId(session.getId())
                            .studentName(session.getStudent().getName())
                            .eventType("SESSION_TERMINATED")
                            .details("Your exam session was terminated due to repeated proctoring violations.")
                            .build());

            // Return early — do NOT also send a regular violation alert (BUG-002 fix)
            return toResponse(saved, aiViolations, session.getStatus());
        }

        // ── Broadcast violation alert to examiner(s) ─────────────────────────
        String alertDetail = String.join(", ", aiViolations) + " | severity=" + ai.getSeverityLevel();
        messagingTemplate.convertAndSend(
                "/topic/alerts/" + session.getExam().getId(),
                AlertMessage.builder()
                        .sessionId(session.getId())
                        .studentName(session.getStudent().getName())
                        .eventType(eventType.name())
                        .details(alertDetail)
                        .build());

        log.warn("Proctoring alert: session={} violations={} severity={}",
                session.getId(), aiViolations, ai.getSeverityLevel());

        return toResponse(saved, aiViolations, session.getStatus());
    }

    // -----------------------------------------------------------------------
    // enrollReference
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public void enrollReference(Long sessionId, String imageBase64, String studentEmail) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));

        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You do not own this session");
        }
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }
        // Once set, the reference is fixed — re-enrolling mid-exam would let a
        // stand-in replace the original candidate's face.
        if (session.getReferenceEmbedding() != null) {
            throw new IllegalStateException("Reference photo already enrolled for this session");
        }

        List<Double> embedding = aiServiceClient.embed(imageBase64);
        if (embedding == null) {
            throw new BadRequestException("No face detected in the photo — please retake it");
        }

        session.setReferenceEmbedding(embedding);
        sessionRepository.save(session);
        log.info("Reference photo enrolled for session {}", sessionId);
    }

    // -----------------------------------------------------------------------
    // recordBrowserEvent
    // -----------------------------------------------------------------------

    @Override
    @Transactional
    public BrowserEventResponse recordBrowserEvent(Long sessionId, ViolationType type, String studentEmail) {
        // Severity is fixed server-side so a client cannot downgrade its own violations
        ViolationSeverity severity = switch (type) {
            case TAB_SWITCH      -> ViolationSeverity.HIGH;
            case FULLSCREEN_EXIT -> ViolationSeverity.MEDIUM;
            default -> throw new BadRequestException("Unsupported browser event type: " + type);
        };

        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You do not own this session");
        }
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }

        String detail = type == ViolationType.TAB_SWITCH
                ? "Student switched tab or left the exam window"
                : "Student exited full-screen mode";
        violationRepository.save(Violation.builder()
                .session(session)
                .organization(session.getOrganization())
                .type(type)
                .severity(severity)
                .details(detail)
                .reviewed(false)
                .build());

        String alertTopic = "/topic/alerts/" + session.getExam().getId();
        messagingTemplate.convertAndSend(alertTopic, AlertMessage.builder()
                .sessionId(session.getId())
                .studentName(session.getStudent().getName())
                .eventType(type.name())
                .details(detail + " | severity=" + severity)
                .build());

        long tabSwitchCount = violationRepository.countBySessionIdAndType(session.getId(), ViolationType.TAB_SWITCH);
        int tabSwitchLimit = session.getExam().getProctoringRules().getTabSwitchLimit();
        boolean autoSubmit = type == ViolationType.TAB_SWITCH
                && tabSwitchLimit > 0
                && tabSwitchCount >= tabSwitchLimit;

        if (autoSubmit) {
            // Same outcome as a normal submit: answers are scored and the session is COMPLETED
            session.setScore(scoreCalculationService.calculate(session));
            session.setStatus(SessionStatus.COMPLETED);
            session.setEndTime(LocalDateTime.now(ZoneId.of("UTC")));
            sessionRepository.save(session);

            log.warn("Session {} auto-submitted after {} tab switches", session.getId(), tabSwitchCount);
            messagingTemplate.convertAndSend(alertTopic, AlertMessage.builder()
                    .sessionId(session.getId())
                    .studentName(session.getStudent().getName())
                    .eventType("SESSION_AUTO_SUBMITTED")
                    .details("Exam auto-submitted after " + tabSwitchCount + " tab switches")
                    .build());
        }

        return BrowserEventResponse.builder()
                .tabSwitchCount(tabSwitchCount)
                .autoSubmitted(autoSubmit)
                .build();
    }

    // -----------------------------------------------------------------------
    // getMyViolationCount
    // -----------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public long getMyViolationCount(Long sessionId, String studentEmail) {
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        if (!session.getStudent().getEmail().equals(studentEmail)) {
            throw new UnauthorizedException("You do not own this session");
        }
        return violationRepository.countBySessionId(sessionId);
    }

    // -----------------------------------------------------------------------
    // getEventsBySession
    // -----------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public List<ProctoringEventResponse> getEventsBySession(Long sessionId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", requesterEmail));
        ExamSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session", sessionId));
        validateSameOrganization(requester, session);
        return eventRepository.findBySessionIdOrderByDetectedAtDesc(sessionId)
                .stream().map(this::toResponse).toList();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /** Stores the frame behind a violation so a reviewer can see why it was flagged. */
    private void saveEvidence(Violation violation, String frameBase64) {
        byte[] image;
        try {
            image = java.util.Base64.getDecoder().decode(frameBase64);
        } catch (IllegalArgumentException ex) {
            log.warn("Frame for session {} is not valid base64 — no evidence stored",
                    violation.getSession().getId());
            return;
        }
        evidenceRepository.save(ViolationEvidence.builder()
                .violation(violation)
                .contentType("image/jpeg")
                .data(image)
                .build());
    }

    /** Builds a human-readable detail string for the proctoring event record. */
    private String buildEventDetails(int faceCount, AnalyzeResponse ai) {
        if (faceCount == 0) return "No face detected in frame";
        if (faceCount > 1)  return faceCount + " faces detected in frame";

        List<String> parts = new ArrayList<>();
        parts.add("1 face detected");
        if (ai.getGaze() != null && ai.getGaze().isLookingAway()) {
            parts.add("gaze deviation: " + ai.getGaze().getReason());
        }
        if (ai.getObjects() != null && ai.getObjects().isFlagged()) {
            List<String> labels = ai.getObjects().getUnauthorizedObjects().stream()
                    .map(o -> o.getLabel()).toList();
            parts.add("unauthorized objects: " + String.join(", ", labels));
        }
        return String.join(" | ", parts);
    }

    /** Builds a per-violation detail string for the Violation record. */
    private String buildViolationDetail(ViolationType type, AnalyzeResponse ai) {
        return switch (type) {
            case LOOKING_AWAY -> {
                String reason = (ai.getGaze() != null && ai.getGaze().getReason() != null)
                        ? ai.getGaze().getReason() : "unknown";
                yield "Gaze deviation detected: " + reason;
            }
            case UNAUTHORIZED_OBJECT -> {
                if (ai.getObjects() != null && ai.getObjects().getUnauthorizedObjects() != null) {
                    List<String> labels = ai.getObjects().getUnauthorizedObjects().stream()
                            .map(o -> o.getLabel() + " (" + String.format("%.0f", o.getConfidence() * 100) + "%)")
                            .toList();
                    yield "Unauthorized object(s) detected: " + String.join(", ", labels);
                }
                yield "Unauthorized object detected";
            }
            case IDENTITY_MISMATCH -> {
                String sim = (ai.getIdentity() != null && ai.getIdentity().getSimilarity() != null)
                        ? String.format("similarity=%.3f", ai.getIdentity().getSimilarity()) : "";
                yield "Identity mismatch" + (sim.isEmpty() ? "" : " (" + sim + ")");
            }
            case SPEECH_DETECTED -> String.format("Speech detected (%.0f%% of the audio chunk)",
                    ai.getVoiceActivity().getSpeechFraction() * 100);
            case NO_FACE_DETECTED       -> "No face detected in frame";
            case MULTIPLE_FACES_DETECTED -> {
                int count = (ai.getFace() != null) ? ai.getFace().getFaceCount() : 0;
                yield count + " faces detected in frame";
            }
            default -> type.name();
        };
    }

    private void validateSameOrganization(User user, ExamSession session) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getOrganization() == null || session.getOrganization() == null
                || !user.getOrganization().getId().equals(session.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this session");
        }
        if (user.getRole() == Role.PROCTOR
                && !examProctorService.isProctorAssignedToExam(
                        user.getId(), session.getExam().getId())) {
            throw new UnauthorizedException("You are not assigned to proctor this exam");
        }
    }

    private ProctoringEventResponse toResponse(ProctoringEvent event, List<String> violations,
                                               SessionStatus sessionStatus) {
        ProctoringEventResponse response = toResponse(event);
        response.setViolationsDetected(violations);
        response.setSessionStatus(sessionStatus);
        return response;
    }

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
