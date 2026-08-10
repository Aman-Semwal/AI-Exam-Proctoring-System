package com.proctor.proctorbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Value("${ai.service.url}")
    private String aiServiceUrl;

    @Value("${judge0.api.url}")
    private String judge0Url;

    @Value("${judge0.api.key:}")
    private String judge0ApiKey;

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
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("X-RapidAPI-Key", judge0ApiKey)
                .defaultHeader("X-RapidAPI-Host", "judge0-ce.p.rapidapi.com")
                .build();
    }
}
