package com.proctor.proctorbackend.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class WebClientConfigTest {

    @Test
    void judge0WebClientSendsRapidApiHeadersWhenKeyIsConfigured() {
        AtomicReference<HttpHeaders> capturedHeaders = new AtomicReference<>();
        WebClient client = judge0Client("rapid-key", "judge0-ce.p.rapidapi.com", capturedHeaders);

        client.get().uri("/languages").retrieve().bodyToMono(String.class).block();

        HttpHeaders headers = capturedHeaders.get();
        assertEquals("application/json", headers.getFirst(HttpHeaders.CONTENT_TYPE));
        assertEquals("rapid-key", headers.getFirst("X-RapidAPI-Key"));
        assertEquals("judge0-ce.p.rapidapi.com", headers.getFirst("X-RapidAPI-Host"));
    }

    @Test
    void judge0WebClientOmitsRapidApiHeadersWhenKeyIsBlank() {
        AtomicReference<HttpHeaders> capturedHeaders = new AtomicReference<>();
        WebClient client = judge0Client("", "judge0-ce.p.rapidapi.com", capturedHeaders);

        client.get().uri("/languages").retrieve().bodyToMono(String.class).block();

        HttpHeaders headers = capturedHeaders.get();
        assertEquals("application/json", headers.getFirst(HttpHeaders.CONTENT_TYPE));
        assertNull(headers.getFirst("X-RapidAPI-Key"));
        assertNull(headers.getFirst("X-RapidAPI-Host"));
    }

    private WebClient judge0Client(
            String apiKey,
            String rapidApiHost,
            AtomicReference<HttpHeaders> capturedHeaders) {

        WebClientConfig config = new WebClientConfig();
        ReflectionTestUtils.setField(config, "judge0Url", "https://judge0-ce.p.rapidapi.com");
        ReflectionTestUtils.setField(config, "judge0ApiKey", apiKey);
        ReflectionTestUtils.setField(config, "judge0RapidApiHost", rapidApiHost);

        ExchangeFunction exchange = request -> {
            capturedHeaders.set(request.headers());
            return Mono.just(ClientResponse.create(HttpStatus.OK).body("{}").build());
        };

        return config.judge0WebClient(WebClient.builder().exchangeFunction(exchange));
    }
}
