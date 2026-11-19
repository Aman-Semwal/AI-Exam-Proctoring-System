package com.proctor.proctorbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Value("${ai.service.api-key:}")
    private String aiServiceApiKey;

    @Value("${judge0.api.url}")
    private String judge0Url;

    @Value("${judge0.api.key:}")
    private String judge0ApiKey;

    @Value("${judge0.api.rapidapi-host:judge0-ce.p.rapidapi.com}")
    private String judge0RapidApiHost;

    @Value("${ai.service.connect-timeout-ms:5000}")
    private int aiServiceConnectTimeoutMs;

    @Value("${ai.service.response-timeout-seconds:5}")
    private long aiServiceResponseTimeoutSeconds;

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }

    @Bean
    public WebClient aiServiceWebClient(WebClient.Builder builder) {
        HttpClient httpClient = HttpClient.create()
                .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, aiServiceConnectTimeoutMs)
                .responseTimeout(Duration.ofSeconds(aiServiceResponseTimeoutSeconds));
        return builder
                .clone()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(aiServiceUrl)
                .defaultHeader("Content-Type", "application/json")
                // secure-code-guardian: send the shared API key on every inference request
                // so the AI service can reject calls from any unauthorized source.
                // Configured via AI_SERVICE_API_KEY in backend/.env.
                .defaultHeaders(headers -> {
                    if (aiServiceApiKey != null && !aiServiceApiKey.isBlank()) {
                        headers.set("X-API-Key", aiServiceApiKey);
                    }
                })
                .build();
    }

    @Bean
    public WebClient judge0WebClient(WebClient.Builder builder) {
        HttpClient httpClient = HttpClient.create()
            .option(io.netty.channel.ChannelOption.CONNECT_TIMEOUT_MILLIS, 5_000)
            .responseTimeout(Duration.ofSeconds(10));
        return builder
            .clone()
            .clientConnector(new ReactorClientHttpConnector(httpClient))
                .baseUrl(judge0Url)
                .defaultHeaders(headers -> {
                    headers.setContentType(MediaType.APPLICATION_JSON);
                    if (judge0ApiKey != null && !judge0ApiKey.isBlank()) {
                        headers.set("X-RapidAPI-Key", judge0ApiKey);
                        headers.set("X-RapidAPI-Host", judge0RapidApiHost);
                    }
                })
                .build();
    }
}
