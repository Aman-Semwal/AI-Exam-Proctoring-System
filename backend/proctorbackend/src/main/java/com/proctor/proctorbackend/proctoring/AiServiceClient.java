package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.AnalyzeResponse;
import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Collections;
import java.util.List;

/**
 * HTTP client for the Python FastAPI AI service.
 *
 * <p>Wraps a reactive {@link WebClient} and exposes a blocking API so callers
 * (running on standard servlet threads) do not need to handle reactive types.
 *
 * <h3>ISSUE-1 fix — upgraded from {@code /infer/face} to {@code /infer/analyze}</h3>
 * <p>The previous implementation only called {@code POST /infer/face}, returning a
 * bare face count. The full proctoring pipeline — gaze deviation, unauthorized-object
 * detection, identity mismatch — was silently inactive because the backend never
 * called the endpoints that produce those signals.
 *
 * <p>{@code POST /infer/analyze} runs all four detectors in one request (one frame
 * decode, one round trip) and returns a combined violation list with a severity score.
 * {@code ProctoringServiceImpl} now maps the AI violation list directly to
 * {@link com.proctor.proctorbackend.violation.ViolationType} values instead of
 * deriving the violation solely from a raw face count.
 *
 * <h3>Resilience</h3>
 * <p>If the AI service is unavailable or returns any error, the call falls back to a
 * synthetic {@link AnalyzeResponse} that reports {@code face_count = 0} (treated as
 * {@code NO_FACE_DETECTED}) so the proctoring flow is never fully broken by a transient
 * AI failure. The fallback is logged at ERROR level so failures are observable.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    /**
     * Sends a base64-encoded image frame to {@code POST /infer/analyze} and returns
     * the full analysis result including violations and severity level.
     *
     * <p>Only the image is required. Identity verification and voice-activity analysis
     * are opt-in: pass a non-null {@code referenceEmbedding} or {@code audioBase64}
     * to enable them. Both are {@code null} in the default per-frame tick — the
     * backend can enable them selectively (e.g. identity check every N frames,
     * audio check when the frontend captures a chunk).
     *
     * @param frameBase64        base64-encoded JPEG/PNG webcam frame (required)
     * @param referenceEmbedding 512-dim ArcFace embedding from enrollment; {@code null}
     *                           to skip identity verification
     * @param audioBase64        base64 16-bit PCM WAV (mono, 16kHz); {@code null} to
     *                           skip voice-activity detection
     * @return full {@link AnalyzeResponse}; returns a zero-face fallback on any error
     */
    public AnalyzeResponse analyze(String frameBase64,
                                   List<Double> referenceEmbedding,
                                   String audioBase64) {
        // Build request body — only include optional fields when non-null
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("image", frameBase64);
        if (referenceEmbedding != null) {
            body.put("reference_embedding", referenceEmbedding);
        }
        if (audioBase64 != null) {
            body.put("audio", audioBase64);
        }

        return aiServiceWebClient
                .post()
                .uri("/infer/analyze")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(AnalyzeResponse.class)
                .timeout(Duration.ofSeconds(10))
                .onErrorResume(ex -> {
                    log.error("AI service /infer/analyze failed: {}", ex.getMessage());
                    return Mono.just(buildFallbackResponse());
                })
                .block();
    }

    /**
     * Convenience overload for the common case: image-only frame tick
     * (no identity check, no audio).
     */
    public AnalyzeResponse analyze(String frameBase64) {
        return analyze(frameBase64, null, null);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Fallback returned when the AI service is unreachable or returns an error.
     *
     * <p><strong>Policy (Fix #3):</strong> An AI outage should not generate proctoring
     * violations. Returning a synthetic {@code "no_face"} violation during an outage
     * causes false positives — the student is penalised for infrastructure failure, not
     * exam misconduct. Instead, we return an empty violations list and mark the gaze
     * reason as {@code "ai_service_unavailable"}. {@code ProctoringServiceImpl} detects
     * this sentinel and skips recording any violations for the frame (skip-frame policy).
     */
    private AnalyzeResponse buildFallbackResponse() {
        FaceInferenceResult face = buildFallbackFaceResult();

        // Sentinel gaze result — reason signals the outage to ProctoringServiceImpl
        com.proctor.proctorbackend.proctoring.dto.GazeResult gaze =
                new com.proctor.proctorbackend.proctoring.dto.GazeResult();
        gaze.setFaceDetected(false);
        gaze.setLookingAway(false);
        gaze.setReason("ai_service_unavailable");

        // Empty object detection
        com.proctor.proctorbackend.proctoring.dto.ObjectDetectionResult objects =
                new com.proctor.proctorbackend.proctoring.dto.ObjectDetectionResult();
        objects.setObjects(Collections.emptyList());
        objects.setUnauthorizedObjects(Collections.emptyList());
        objects.setFlagged(false);

        AnalyzeResponse fallback = new AnalyzeResponse();
        fallback.setFace(face);
        fallback.setGaze(gaze);
        fallback.setObjects(objects);
        fallback.setIdentity(null);
        fallback.setVoiceActivity(null);
        // Empty violations list — no false violations during outages
        fallback.setViolations(Collections.emptyList());
        fallback.setSeverityScore(0);
        fallback.setSeverityLevel("NONE");
        return fallback;
    }

    private FaceInferenceResult buildFallbackFaceResult() {
        FaceInferenceResult fallback = new FaceInferenceResult();
        fallback.setFaceCount(0);
        fallback.setFaces(Collections.emptyList());
        return fallback;
    }
}
