package com.proctor.proctorbackend.config;

import com.proctor.proctorbackend.auth.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that intercepts every HTTP request and validates the JWT Bearer token.
 *
 * <p>Extends {@link OncePerRequestFilter} to guarantee single execution per request.
 *
 * <p>Filter logic:
 * <ol>
 *   <li>Read the {@code Authorization} header.</li>
 *   <li>If absent or not a Bearer token, skip and pass to the next filter.</li>
 *   <li>Extract the username (email) from the JWT.</li>
 *   <li>If the {@link org.springframework.security.core.context.SecurityContext} is not yet
 *       populated, load {@link UserDetails} from the database and validate the token.</li>
 *   <li>On valid token, set a {@link UsernamePasswordAuthenticationToken} in the
 *       SecurityContext so downstream code can access the authenticated principal.</li>
 * </ol>
 *
 * <p>Uses {@link SecurityContextHolderStrategy} (injected via the holder's default strategy)
 * rather than the static {@link SecurityContextHolder} methods — the recommended approach
 * in Spring Security 6+ to support custom holder strategies and testability.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    /**
     * Strategy used to create and store the {@link SecurityContext}.
     * Defaults to the globally configured strategy
     * ({@link SecurityContextHolder#getContextHolderStrategy()}).
     */
    private final SecurityContextHolderStrategy securityContextHolderStrategy =
            SecurityContextHolder.getContextHolderStrategy();

    /**
     * Core filter logic executed once per request.
     *
     * @param request     the incoming HTTP request
     * @param response    the outgoing HTTP response
     * @param filterChain the remaining filter chain
     * @throws ServletException if a servlet error occurs
     * @throws IOException      if an I/O error occurs
     */
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && securityContextHolderStrategy.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContext context = securityContextHolderStrategy.createEmptyContext();
                context.setAuthentication(authToken);
                securityContextHolderStrategy.setContext(context);
            }
        }

        filterChain.doFilter(request, response);
    }
}
