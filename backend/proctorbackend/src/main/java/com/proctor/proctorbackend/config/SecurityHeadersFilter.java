package com.proctor.proctorbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that adds security-relevant HTTP response headers to every API response.
 *
 * <h3>Why this matters — JWT-in-localStorage XSS risk (secure-code-guardian)</h3>
 * <p>This application stores the JWT in {@code localStorage}, which is accessible
 * to any JavaScript on the page. If an attacker injects a cross-site scripting (XSS)
 * payload (e.g. via a stored XSS in a user-controlled field rendered without escaping),
 * they can read the token with {@code localStorage.getItem('token')} and hijack the
 * session. The ideal fix is {@code httpOnly} cookies, but that requires a larger
 * refactor. As a defence-in-depth measure, a strict Content-Security-Policy prevents
 * injected scripts from executing in the first place.
 *
 * <h3>Headers added</h3>
 * <ul>
 *   <li><b>Content-Security-Policy</b> — Restricts script sources to {@code 'self'} only,
 *       disabling inline scripts and eval. Inline event handlers ({@code onclick}, etc.)
 *       and injected {@code &lt;script&gt;} tags from external domains are blocked.
 *       This is applied on the API responses rather than HTML responses (the SPA handles
 *       its own CSP via meta tag or the Vite dev server), but it prevents the backend
 *       from serving any page content that could be exploited.</li>
 *   <li><b>X-Content-Type-Options: nosniff</b> — Prevents MIME-type sniffing, which can
 *       lead to XSS when a browser misinterprets a non-script response as JavaScript.</li>
 *   <li><b>X-Frame-Options: DENY</b> — Prevents clickjacking by disallowing the API
 *       from being embedded in an iframe on a third-party site.</li>
 *   <li><b>Referrer-Policy: strict-origin-when-cross-origin</b> — Limits the Referer
 *       header to prevent leaking the full URL (which may contain tokens or IDs) to
 *       third-party origins.</li>
 *   <li><b>Permissions-Policy</b> — Disables browser features (camera, microphone,
 *       geolocation) that the API layer has no need to grant. The frontend SPA will
 *       re-declare its own Permissions-Policy for the webcam/mic it actually needs.</li>
 * </ul>
 *
 * <h3>Note on HSTS</h3>
 * <p>HSTS ({@code Strict-Transport-Security}) is intentionally omitted here.
 * HSTS should only be set when the service is guaranteed to always be served over
 * HTTPS. Setting it on an HTTP endpoint (common in local development) causes browsers
 * to refuse future HTTP connections. Add HSTS at the reverse proxy or load balancer
 * layer where TLS termination happens, not here.
 */
@Component
public class SecurityHeadersFilter extends OncePerRequestFilter {

    /**
     * Content-Security-Policy directive.
     *
     * <p>{@code default-src 'self'} — all resource types default to same-origin only.
     * {@code script-src 'self'} — JavaScript may only be loaded from the same origin;
     * inline scripts and eval are blocked.
     * {@code object-src 'none'} — blocks plugins (Flash, etc.) entirely.
     * {@code frame-ancestors 'none'} — equivalent to X-Frame-Options: DENY, but the
     * CSP version is respected by more modern browsers.
     */
    private static final String CSP_VALUE =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "object-src 'none'; " +
            "frame-ancestors 'none'";

    @Override
    protected void doFilterInternal(HttpServletRequest  request,
                                    HttpServletResponse response,
                                    FilterChain         filterChain)
            throws ServletException, IOException {

        // XSS mitigation — restrict script execution to same origin
        response.setHeader("Content-Security-Policy", CSP_VALUE);

        // Prevent MIME-type sniffing XSS vector
        response.setHeader("X-Content-Type-Options", "nosniff");

        // Clickjacking protection (legacy header — CSP frame-ancestors is preferred
        // but some older proxies / WAFs only recognise this header)
        response.setHeader("X-Frame-Options", "DENY");

        // Limit Referer leakage to same-origin requests
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // Deny hardware feature access at the API layer
        response.setHeader("Permissions-Policy",
                "camera=(), microphone=(), geolocation=(), payment=()");

        filterChain.doFilter(request, response);
    }
}
