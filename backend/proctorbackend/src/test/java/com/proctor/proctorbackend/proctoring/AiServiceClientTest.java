package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.proctoring.dto.AnalyzeResponse;
import com.proctor.proctorbackend.proctoring.dto.FaceInferenceResult;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link AiServiceClient}.
 *
 * Uses MockWebServer (OkHttp) to simulate the Python AI service without
 * any real network call. All tests run in isolation — no Spring context required.
 */
class AiServiceClientTest {

    private MockWebServer mockServer;
    private AiServiceClient client;

    @BeforeEach
    void setUp() throws IOException {
        mockServer = new MockWebServer();
        mockServer.start();
        WebClient webClient = WebClient.builder()
                .baseUrl(mockServer.url("/").toString())
                .build();
        client = new AiServiceClient(webClient);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockServer.shutdown();
    }

    // -----------------------------------------------------------------------
    // analyze(frame) — happy path
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("analyze() — returns full AnalyzeResponse on 200 OK")
    void analyze_singleArg_happyPath() throws InterruptedException {
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .setBody("""
                        {
                          "face": { "face_count": 1, "faces": [] },
                          "gaze": { "face_detected": true, "looking_away": false, "reason": null },
                          "objects": { "objects": [], "unauthorized_objects": [], "flagged": false },
                          "identity": null,
                          "voice_activity": null,
                          "violations": [],
                          "severity_score": 0,
                          "severity_level": "NONE"
                        }
                        """));

        AnalyzeResponse response = client.analyze("base64frame==");

        assertNotNull(response);
        assertEquals(1, response.getFace().getFaceCount());
        assertTrue(response.getViolations().isEmpty());
        assertEquals(0, response.getSeverityScore());
        assertEquals("NONE", response.getSeverityLevel());

        RecordedRequest recorded = mockServer.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/infer/analyze", recorded.getPath());
    }

    @Test
    @DisplayName("analyze() — deserializes violations list correctly")
    void analyze_withViolations_deserializesCorrectly() {
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .setBody("""
                        {
                          "face": { "face_count": 0, "faces": [] },
                          "gaze": { "face_detected": false, "looking_away": true, "reason": "no_face" },
                          "objects": { "objects": [], "unauthorized_objects": [], "flagged": false },
                          "identity": null,
                          "voice_activity": null,
                          "violations": ["no_face"],
                          "severity_score": 15,
                          "severity_level": "HIGH"
                        }
                        """));

        AnalyzeResponse response = client.analyze("emptyframe==");

        assertNotNull(response);
        assertEquals(0, response.getFace().getFaceCount());
        assertEquals(List.of("no_face"), response.getViolations());
        assertEquals(15, response.getSeverityScore());
        assertEquals("HIGH", response.getSeverityLevel());
    }

    @Test
    @DisplayName("analyze(frame, embedding, audio) — includes reference_embedding in request body")
    void analyze_withEmbedding_includesEmbeddingInBody() throws InterruptedException {
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .setBody("""
                        {
                          "face": { "face_count": 1, "faces": [] },
                          "gaze": { "face_detected": true, "looking_away": false, "reason": null },
                          "objects": { "objects": [], "unauthorized_objects": [], "flagged": false },
                          "identity": { "face_detected": true, "match": true, "similarity": 0.92 },
                          "voice_activity": null,
                          "violations": [],
                          "severity_score": 0,
                          "severity_level": "NONE"
                        }
                        """));

        List<Double> embedding = List.of(0.1, 0.2, 0.3);
        AnalyzeResponse response = client.analyze("frame==", embedding, null);

        assertNotNull(response);
        assertTrue(response.getIdentity().isMatch());
        assertEquals(0.92, response.getIdentity().getSimilarity(), 0.001);

        RecordedRequest recorded = mockServer.takeRequest();
        String body = recorded.getBody().readUtf8();
        // Verify the embedding was serialized into the request
        assertTrue(body.contains("reference_embedding"),
                "Request body should contain reference_embedding but was: " + body);
    }

    @Test
    @DisplayName("analyze(frame, null, null) — does NOT include reference_embedding in body")
    void analyze_withoutEmbedding_omitsEmbeddingFromBody() throws InterruptedException {
        mockServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .setBody("""
                        {
                          "face": { "face_count": 1, "faces": [] },
                          "gaze": { "face_detected": true, "looking_away": false, "reason": null },
                          "objects": { "objects": [], "unauthorized_objects": [], "flagged": false },
                          "identity": null,
                          "voice_activity": null,
                          "violations": [],
                          "severity_score": 0,
                          "severity_level": "NONE"
                        }
                        """));

        client.analyze("frame==", null, null);

        RecordedRequest recorded = mockServer.takeRequest();
        String body = recorded.getBody().readUtf8();
        assertFalse(body.contains("reference_embedding"),
                "Request body should NOT contain reference_embedding but was: " + body);
    }

    // -----------------------------------------------------------------------
    // Fallback / resilience (Fix #3)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("analyze() — returns fallback with EMPTY violations when AI service returns 500")
    void analyze_aiServiceError_returnsFallbackWithNoViolations() {
        mockServer.enqueue(new MockResponse().setResponseCode(500));

        AnalyzeResponse response = client.analyze("frame==");

        assertNotNull(response, "Fallback response must not be null");
        // Fix #3: fallback must NOT synthesise a no_face violation
        assertNotNull(response.getViolations(), "violations list must not be null");
        assertTrue(response.getViolations().isEmpty(),
                "AI outage should produce EMPTY violations list, not a no_face violation. "
                        + "Got: " + response.getViolations());
        assertEquals(0, response.getSeverityScore(),
                "Fallback severity score should be 0, not 15");
        assertEquals("NONE", response.getSeverityLevel());
    }

    @Test
    @DisplayName("analyze() — fallback gaze.reason is 'ai_service_unavailable' (sentinel for skip-frame)")
    void analyze_aiServiceError_fallbackGazeReasonIsUnavailableSentinel() {
        mockServer.enqueue(new MockResponse().setResponseCode(503));

        AnalyzeResponse response = client.analyze("frame==");

        assertNotNull(response.getGaze());
        assertEquals("ai_service_unavailable", response.getGaze().getReason(),
                "Fallback must carry the sentinel reason so ProctoringServiceImpl can skip the frame");
        assertFalse(response.getGaze().isLookingAway(),
                "Fallback should not signal looking_away=true (was causing false violations)");
    }

    @Test
    @DisplayName("analyze() — fallback when connection refused (AI service completely down)")
    void analyze_connectionRefused_returnsFallback() throws IOException {
        // Shut down the server to simulate connection refused
        mockServer.shutdown();

        AnalyzeResponse response = client.analyze("frame==");

        assertNotNull(response);
        assertTrue(response.getViolations().isEmpty());
    }

    // -----------------------------------------------------------------------
    // Deprecated method removed (Fix #1)
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("inferFace() method must no longer exist on AiServiceClient")
    void inferFace_methodMustNotExist() {
        // If inferFace() is still present, this test fails with NoSuchMethodException not thrown
        assertThrows(NoSuchMethodException.class,
                () -> AiServiceClient.class.getMethod("inferFace", String.class),
                "inferFace() should have been removed from AiServiceClient");
    }
}
