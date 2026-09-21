package com.proctor.proctorbackend.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servlet filter that enforces per-IP rate limits on authentication endpoints
 * using the Bucket4j token-bucket algorithm.
 *
 * <h3>Threat model</h3>
 * <p>Without rate limiting, {@code POST /api/auth/login} is fully open to
 * brute-force and credential-stuffing attacks — an attacker can try thousands
 * of passwords per second against a known email address.
 *
 * <h3>Limits (secure-code-guardian recommendation)</h3>
 * <ul>
 *   <li><b>Login:</b> 10 attempts per IP per 15 minutes. This allows a legitimate
 *       user who misremembers their password several times to succeed, while making
 *       brute force economically unfeasible (at 10 tries / 900 s, exhausting even
 *       a 10,000-entry wordlist takes ~250 hours per IP).</li>
 *   <li><b>Register:</b> 5 attempts per IP per hour. Registration should be a
 *       one-time action; this blocks automated account-farming.</li>
 * </ul>
 *
 * <h3>Implementation notes</h3>
 * <ul>
 *   <li>Buckets are stored in a {@link ConcurrentHashMap} keyed by {@code X-Forwarded-For}
 *       header (falling back to {@code getRemoteAddr()}). In a load-balanced deployment,
 *       ensure the LB sets {@code X-Forwarded-For} so the real client IP is used.</li>
 *   <li>For production at scale, replace the in-memory map with a Redis-backed
 *       Bucket4j proxy store so limits are shared across multiple backend instances.</li>
 *   <li>Applies only to {@code POST /api/auth/login} and {@code POST /api/auth/register}.
 *       All other paths pass through without counting.</li>
 * </ul>
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    /** Login: 10 requests per 15 minutes per IP. */
    private static final int    LOGIN_CAPACITY            = 10;
    private static final long   LOGIN_REFILL_MINUTES      = 15;

    /** Register: 5 requests per 60 minutes per IP. */
    private static final int    REGISTER_CAPACITY         = 5;
    private static final long   REGISTER_REFILL_MINUTES   = 60;

    /** Per-IP token buckets for the login endpoint. */
    private final Map<String, Bucket> loginBuckets    = new ConcurrentHashMap<>();

    /** Per-IP token buckets for the register endpoint. */
    private final Map<String, Bucket> registerBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         filterChain)
            throws ServletException, IOException {

        String path   = request.getRequestURI();
        String method = request.getMethod();

        // Only rate-limit POST requests to auth endpoints
        if (!"POST".equalsIgnoreCase(method)) {
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket = null;

        if (path.endsWith("/api/auth/login")) {
            String ip = resolveClientIp(request);
            bucket = loginBuckets.computeIfAbsent(ip, k -> buildLoginBucket());
        } else if (path.endsWith("/api/auth/register")) {
            String ip = resolveClientIp(request);
            bucket = registerBuckets.computeIfAbsent(ip, k -> buildRegisterBucket());
        }

        if (bucket != null && !bucket.tryConsume(1)) {
            sendRateLimitResponse(response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Builds a token bucket for the login endpoint:
     * 10 requests per 15-minute window, refilling greedily at the start of
     * each window (greedy refill means tokens arrive all at once after the
     * interval, not slowly over time — appropriate for login since we want
     * a hard window rather than allowing 1 attempt every 90 s indefinitely).
     */
    private Bucket buildLoginBucket() {
        Bandwidth limit = Bandwidth.classic(
                LOGIN_CAPACITY,
                Refill.intervally(LOGIN_CAPACITY, Duration.ofMinutes(LOGIN_REFILL_MINUTES))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Builds a token bucket for the register endpoint:
     * 5 requests per 60-minute window.
     */
    private Bucket buildRegisterBucket() {
        Bandwidth limit = Bandwidth.classic(
                REGISTER_CAPACITY,
                Refill.intervally(REGISTER_CAPACITY, Duration.ofMinutes(REGISTER_REFILL_MINUTES))
        );
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Resolves the real client IP address, respecting {@code X-Forwarded-For}
     * when set by a trusted reverse proxy or load balancer.
     *
     * <p><b>Security note:</b> {@code X-Forwarded-For} is user-controlled when
     * there is no trusted proxy in front of this service. If deployed directly
     * to the internet (no LB / WAF), prefer {@code getRemoteAddr()} only and
     * remove the header check, or validate that the header source is trusted.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // XFF can contain a comma-separated chain; first value is the client IP
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Writes a 429 Too Many Requests JSON response with a {@code Retry-After}
     * header indicating how long the client should wait before retrying.
     */
    private void sendRateLimitResponse(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        // Retry-After in seconds — conservative upper bound matching the login window
        response.setHeader("Retry-After", String.valueOf(LOGIN_REFILL_MINUTES * 60));
        response.getWriter().write(
                "{\"error\":\"Too Many Requests\"," +
                "\"message\":\"Rate limit exceeded. Please wait before trying again.\"}"
        );
    }
}
