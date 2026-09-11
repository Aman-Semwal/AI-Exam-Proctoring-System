package com.proctor.proctorbackend.coderunner;

import com.proctor.proctorbackend.coderunner.dto.CodeRunRequest;
import com.proctor.proctorbackend.coderunner.dto.CodeRunTestCaseRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class Judge0ServiceTest {

    @Test
    void runCreatesAsyncSubmissionAndPollsResult() {
        FakeJudge0Exchange exchange = new FakeJudge0Exchange();
        WebClient webClient = WebClient.builder()
                .baseUrl("https://judge0.example")
                .exchangeFunction(exchange)
                .build();
        Judge0Service service = new Judge0Service(webClient);

        CodeRunTestCaseRequest testCase = new CodeRunTestCaseRequest();
        testCase.setInput("hi");
        testCase.setExpectedOutput("hi");

        CodeRunRequest request = new CodeRunRequest();
        request.setLanguage("python");
        request.setCode("print(input())");
        request.setTestCases(List.of(testCase));

        var response = service.run(request);

        assertEquals(1, response.getTotalTests());
        assertEquals(1, response.getPassed());
        assertTrue(response.getResults().getFirst().isPassed());
        assertEquals("hi", response.getResults().getFirst().getActualOutput());
        assertTrue(exchange.requestUris.contains("/submissions?base64_encoded=true&wait=false"));
        assertTrue(exchange.requestUris.stream().anyMatch(uri ->
                uri.startsWith("/submissions/submission-token?base64_encoded=true")));
        assertFalse(exchange.requestUris.stream().anyMatch(uri -> uri.contains("wait=true")));
    }

    @Test
    void runReturnsProviderErrorMessageWhenRapidApiRejectsRequest() {
        WebClient webClient = WebClient.builder()
                .baseUrl("https://judge0.example")
                .exchangeFunction(request -> Mono.just(ClientResponse.create(HttpStatus.FORBIDDEN)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .body("""
                                {"message":"You are not subscribed to this API."}
                                """)
                        .build()))
                .build();
        Judge0Service service = new Judge0Service(webClient);

        CodeRunTestCaseRequest testCase = new CodeRunTestCaseRequest();
        testCase.setInput("");
        testCase.setExpectedOutput("");

        CodeRunRequest request = new CodeRunRequest();
        request.setLanguage("python");
        request.setCode("print('ok')");
        request.setTestCases(List.of(testCase));

        var response = service.run(request);

        assertEquals(1, response.getFailed());
        assertTrue(response.getResults().getFirst().getError().contains("You are not subscribed to this API."));
    }

    private static final class FakeJudge0Exchange implements ExchangeFunction {
        private final List<String> requestUris = new ArrayList<>();

        @Override
        public Mono<ClientResponse> exchange(ClientRequest request) {
            requestUris.add(request.url().getRawPath() + "?" + request.url().getRawQuery());
            if ("POST".equals(request.method().name())) {
                return Mono.just(jsonResponse(HttpStatus.CREATED, """
                        {"token":"submission-token"}
                        """));
            }
            return Mono.just(jsonResponse(HttpStatus.OK, """
                    {
                      "stdout": "aGkK",
                      "stderr": null,
                      "compile_output": null,
                      "message": null,
                      "status": {"id": 3, "description": "Accepted"}
                    }
                    """));
        }

        private ClientResponse jsonResponse(HttpStatus status, String body) {
            return ClientResponse.create(status)
                    .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                    .body(body)
                    .build();
        }
    }
}
