package com.proctor.proctorbackend.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Central Spring Security configuration for the proctoring backend.
 *
 * <p>Key decisions:
 * <ul>
 *   <li>CSRF disabled — the API is stateless (no cookie-based sessions).</li>
 *   <li>Session management set to {@code STATELESS} — all state lives in the JWT.</li>
 *   <li>{@link JwtAuthFilter} is inserted before the standard username/password filter.</li>
 *   <li>BCrypt strength 12 provides a good balance between security and hash speed.</li>
 *   <li>{@code @EnableMethodSecurity} activates {@code @PreAuthorize} on controller methods.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * URL patterns that do not require a JWT (public access).
     *
     * <p><b>BUG-018 fix:</b> {@code /ws/**} is included here so that the WebSocket
     * upgrade handshake (and SockJS HTTP polling fallback) is not blocked by Spring
     * Security before reaching the STOMP layer. Actual WebSocket authentication is
     * enforced by {@link WebSocketAuthInterceptor} on the STOMP {@code CONNECT} frame,
     * which validates the JWT passed as a STOMP header. Blocking at the HTTP filter
     * level would prevent clients from ever reaching the STOMP layer to present their
     * token, making connection impossible for all clients regardless of auth state.
     */
    private static final String[] PUBLIC_URLS = {
            "/api/auth/**",
            "/api/organizations/invitations/**",
            "/api/health",
            "/ws/**",                  // BUG-018: WebSocket upgrade + SockJS fallback
            "/swagger-ui/**",
            "/v3/api-docs/**",
            "/swagger-ui.html"
    };

    /**
     * Builds and returns the main {@link SecurityFilterChain}.
     *
     * @param http the {@link HttpSecurity} builder provided by Spring
     * @return configured filter chain
     * @throws Exception if configuration fails
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_URLS).permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(unauthorizedEntryPoint())
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Returns 401 Unauthorized (with a JSON-friendly message) whenever an
     * unauthenticated request hits a protected endpoint. Without this, Spring
     * Security's default behaviour is to return 403 Forbidden, which is
     * semantically incorrect for a missing/invalid token.
     */
    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized\",\"message\":\"" +
                    authException.getMessage() + "\"}");
        };
    }

    /**
     * BCrypt password encoder with strength factor 12.
     *
     * @return the configured {@link PasswordEncoder}
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * Exposes the {@link AuthenticationManager} as a Spring bean so it can be
     * injected into {@link com.proctor.proctorbackend.auth.AuthServiceImpl}.
     *
     * @param config Spring's {@link AuthenticationConfiguration}
     * @return the default {@link AuthenticationManager}
     * @throws Exception if the manager cannot be obtained
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}
