package com.proctor.proctorbackend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Global CORS configuration for the REST API.
 *
 * <p>Allows the Vite dev server (default: {@code http://localhost:5173}) and any
 * additional origins configured via {@code FRONTEND_URL} in {@code .env} to call
 * the backend from a browser. Without this, all cross-origin preflight requests
 * (OPTIONS) are blocked by the browser before they reach the Spring Security filter
 * chain, making the frontend completely unable to talk to the backend.
 *
 * <h3>Why a CorsFilter bean and not just {@code WebMvcConfigurer#addCorsMappings}?</h3>
 * <p>Spring Security's filter chain runs before the DispatcherServlet, so a CORS
 * config registered only through MVC is applied too late — the security filter
 * rejects the preflight before MVC ever sees it. Registering a {@link CorsFilter}
 * bean that Spring Security detects and inserts ahead of its own filters is the
 * correct approach for a stateless JWT API.
 *
 * <h3>Security notes</h3>
 * <ul>
 *   <li>Only the explicit origin(s) from config are allowed — no wildcard.</li>
 *   <li>Credentials (Authorization header) are permitted because the frontend
 *       sends JWT as {@code Bearer} on every request.</li>
 *   <li>Exposed headers include {@code Authorization} so the frontend can read
 *       tokens from response headers if needed in the future.</li>
 * </ul>
 */
@Configuration
public class CorsConfig {

    /**
     * Primary allowed origin — defaults to the Vite dev server.
     * Override by setting {@code FRONTEND_URL} in {@code backend/.env}.
     */
    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Optional comma-separated list of additional allowed origins
     * (e.g. a staging URL). Defaults to empty.
     */
    @Value("${app.cors.extra-origins:}")
    private String extraOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Build the allowed-origins list: primary + any extras
        java.util.List<String> origins = new java.util.ArrayList<>();
        origins.add(frontendUrl.trim());

        if (extraOrigins != null && !extraOrigins.isBlank()) {
            for (String origin : extraOrigins.split(",")) {
                String trimmed = origin.trim();
                if (!trimmed.isEmpty()) {
                    origins.add(trimmed);
                }
            }
        }

        config.setAllowedOrigins(origins);

        // Standard HTTP methods used by the REST API
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Headers the frontend sends — Content-Type + JWT Bearer token
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "Accept",
                "X-Requested-With"
        ));

        // Expose Authorization so the frontend can read it from responses
        config.setExposedHeaders(List.of("Authorization"));

        // Required for the JWT Authorization header to be forwarded
        config.setAllowCredentials(true);

        // Cache preflight response for 1 hour — reduces OPTIONS round trips
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        // fullstack-guardian: WebSocket upgrade requests to /ws/** are also
        // cross-origin in the browser. SockJS makes HTTP requests to /ws/**
        // before upgrading to WS, and those preflight requests fail without
        // a matching CORS registration. The actual STOMP authentication is
        // enforced by WebSocketAuthInterceptor on the CONNECT frame — CORS
        // here only controls which origins the browser allows to initiate
        // the connection, not whether the connection is authenticated.
        source.registerCorsConfiguration("/ws/**", config);

        return source;
    }
}
