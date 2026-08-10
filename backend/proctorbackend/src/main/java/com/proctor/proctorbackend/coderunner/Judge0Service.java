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
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class Judge0Service {

    private final WebClient judge0WebClient;

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
        String input = tc.getInput();
        String expectedOutput = tc.getExpectedOutput().trim();

        Map<String, Object> submission = Map.of(
                "language_id",    langId,
                "source_code",    Base64.getEncoder().encodeToString(code.getBytes(StandardCharsets.UTF_8)),
                "stdin",          Base64.getEncoder().encodeToString(input.getBytes(StandardCharsets.UTF_8)),
                "base64_encoded", true
        );

        Map<?, ?> response;
        try {
            response = judge0WebClient.post()
                .uri("/submissions?base64_encoded=true&wait=true")
                .bodyValue(submission)
                .retrieve()
                .bodyToMono(Map.class)
                .block(Duration.ofSeconds(15));
        } catch (WebClientResponseException | WebClientRequestException ex) {
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

        String actualOutput = stdout == null ? "" : stdout.trim();
        String error = (stderr != null && !stderr.isBlank()) ? stderr
                     : (compileOutput != null && !compileOutput.isBlank()) ? compileOutput
                 : statusDescription;

        return TestCaseResult.builder()
                .input(input)
                .expectedOutput(expectedOutput)
                .actualOutput(actualOutput)
            .passed(Integer.valueOf(3).equals(statusId) && expectedOutput.equals(actualOutput))
                .error(error)
                .build();
    }

    private String decodeBase64(String value) {
        if (value == null) return null;
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return value;
        }
    }
}
