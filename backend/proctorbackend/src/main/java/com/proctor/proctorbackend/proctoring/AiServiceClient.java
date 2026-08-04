package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * HTTP client for the Python FastAPI AI service.
 *
 * <p>Wraps a reactive {@link WebClient} and exposes a blocking API so callers
 * (which run in a standard servlet thread) do not need to handle reactive types.
 *
 * <p>The AI service URL is configured via the {@code AI_SERVICE_URL} environment
 * variable (e.g. {@code http://ai-service:8000} inside Docker Compose).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiServiceClient {

    private final WebClient aiServiceWebClient;

    /**
     * Sends a base64-encoded image frame to the AI service's {@code POST /infer/face}
     * endpoint and returns the face detection result.
     *
     * <p><strong>Resilience:</strong> If the AI service is unavailable or returns an error,
     * the call falls back to a {@link FaceInferenceResult} with {@code faceCount = 0}
     * (treated as {@code NO_FACE_DETECTED}) so the proctoring flow is never fully broken
     * by a transient AI failure.
     *
     * @param frameBase64 the base64-encoded JPEG/PNG webcam frame
     * @return {@link FaceInferenceResult} containing the number of detected faces;
     *         returns a zero-count fallback on error
     */
    public FaceInferenceResult inferFace(String frameBase64) {
        return aiServiceWebClient
                .post()
                .uri("/infer/face")
                .bodyValue(Map.of("image", frameBase64))
                .retrieve()
                .bodyToMono(FaceInferenceResult.class)
                .onErrorResume(ex -> {
                    log.error("AI service call failed: {}", ex.getMessage());
                    // Return empty result on AI service failure — do not break proctoring flow
                    FaceInferenceResult fallback = new FaceInferenceResult();
                    fallback.setFaceCount(0);
                    return Mono.just(fallback);
                })
                .block();
    }
}
