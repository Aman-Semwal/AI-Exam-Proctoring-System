package com.proctor.proctorbackend.coderunner;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.coderunner.dto.CodeRunRequest;
import com.proctor.proctorbackend.coderunner.dto.CodeRunResponse;
import com.proctor.proctorbackend.coderunner.dto.CodeRunTestCaseRequest;
import com.proctor.proctorbackend.coderunner.dto.TestCaseResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class Judge0Service {

    private final WebClient judge0WebClient;
    private static final int ACCEPTED_STATUS_ID = 3;
    private static final int QUEUED_STATUS_ID = 1;
    private static final int PROCESSING_STATUS_ID = 2;
    private static final int MAX_POLL_ATTEMPTS = 12;
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final Duration POLL_DELAY = Duration.ofMillis(500);

    private static final Map<String, Integer> LANGUAGE_IDS = Map.of(
        "java",       62,
        "python",     71,
        "cpp",        54,
        "c",          50,
        "javascript", 63
    );

    public CodeRunResponse run(CodeRunRequest request) {
        Integer langId = LANGUAGE_IDS.get(request.getLanguage().toLowerCase(Locale.ROOT));
        if (langId == null) {
            throw new BadRequestException("Unsupported language: " + request.getLanguage());
        }

        List<TestCaseResult> results = request.getTestCases().stream()
                .map(tc -> runSingle(langId, request.getCode(), tc))
                .toList();

        long passedCount = results.stream().filter(TestCaseResult::isPassed).count();

        return CodeRunResponse.builder()
                .totalTests(results.size())
                .passed((int) passedCount)
                .failed(results.size() - (int) passedCount)
                .results(results)
                .build();
    }

    private TestCaseResult runSingle(int langId, String code, CodeRunTestCaseRequest tc) {
        String input = tc.getInput() == null ? "" : tc.getInput();
        String expectedOutput = tc.getExpectedOutput() == null ? "" : tc.getExpectedOutput().trim();

        Map<String, Object> submission = Map.of(
                "language_id",    langId,
                "source_code",    Base64.getEncoder().encodeToString(code.getBytes(StandardCharsets.UTF_8)),
                "stdin",          Base64.getEncoder().encodeToString(input.getBytes(StandardCharsets.UTF_8))
        );

        Map<?, ?> response;
        try {
            response = createAndPollSubmission(submission);
        } catch (WebClientResponseException ex) {
            return TestCaseResult.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput("")
                .passed(false)
                .error(buildJudge0ResponseError(ex))
                .build();
        } catch (WebClientRequestException ex) {
            return TestCaseResult.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput("")
                .passed(false)
                .error("Judge0 request failed")
                .build();
        } catch (RuntimeException ex) {
            return TestCaseResult.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput("")
                .passed(false)
                .error("Judge0 request timed out")
                .build();
        }

        if (response == null) {
            return TestCaseResult.builder()
                    .input(input).expectedOutput(expectedOutput)
                    .actualOutput("").passed(false).error("No response from Judge0")
                    .build();
        }

        Map<?, ?> status = response.get("status") instanceof Map<?, ?> statusMap ? statusMap : Map.of();
        Integer statusId = status.get("id") instanceof Number number ? number.intValue() : null;
        String statusDescription = status.get("description") instanceof String description ? description : null;

        String stdout        = decodeBase64((String) response.get("stdout"));
        String stderr        = decodeBase64((String) response.get("stderr"));
        String compileOutput = decodeBase64((String) response.get("compile_output"));
        String message       = decodeBase64((String) response.get("message"));

        String actualOutput = stdout == null ? "" : stdout.trim();
        String error = (stderr != null && !stderr.isBlank()) ? stderr
                     : (compileOutput != null && !compileOutput.isBlank()) ? compileOutput
                     : (message != null && !message.isBlank()) ? message
                 : statusDescription;

        return TestCaseResult.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput(actualOutput)
            .passed(Integer.valueOf(ACCEPTED_STATUS_ID).equals(statusId) && expectedOutput.equals(actualOutput))
                .error(error)
                .build();
    }

    private Map<?, ?> createAndPollSubmission(Map<String, Object> submission) {
        Map<?, ?> created = judge0WebClient.post()
                .uri("/submissions?base64_encoded=true&wait=false")
                .bodyValue(submission)
                .retrieve()
                .bodyToMono(Map.class)
                .block(REQUEST_TIMEOUT);

        if (created == null || !(created.get("token") instanceof String token) || token.isBlank()) {
            return created;
        }

        Map<?, ?> current = created;
        for (int attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            current = getSubmission(token);
            Integer statusId = extractStatusId(current);
            if (!Integer.valueOf(QUEUED_STATUS_ID).equals(statusId)
                    && !Integer.valueOf(PROCESSING_STATUS_ID).equals(statusId)) {
                return current;
            }
            sleepBeforeNextPoll();
        }

        return current;
    }

    private Map<?, ?> getSubmission(String token) {
        return judge0WebClient.get()
                .uri("/submissions/{token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,status", token)
                .retrieve()
                .bodyToMono(Map.class)
                .block(REQUEST_TIMEOUT);
    }

    private Integer extractStatusId(Map<?, ?> response) {
        if (response == null || !(response.get("status") instanceof Map<?, ?> status)) {
            return null;
        }
        return status.get("id") instanceof Number number ? number.intValue() : null;
    }

    private void sleepBeforeNextPoll() {
        try {
            Thread.sleep(POLL_DELAY.toMillis());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while waiting for Judge0 result", ex);
        }
    }

    private String decodeBase64(String value) {
        if (value == null) return null;
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return value;
        }
    }

    private String buildJudge0ResponseError(WebClientResponseException ex) {
        String responseBody = ex.getResponseBodyAsString();
        if (responseBody == null || responseBody.isBlank()) {
            return "Judge0 request failed";
        }
        String compactBody = responseBody.replaceAll("\\s+", " ").trim();
        return "Judge0 request failed: " + compactBody.substring(0, Math.min(compactBody.length(), 300));
    }
}
