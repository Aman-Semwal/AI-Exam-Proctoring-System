package com.proctor.proctorbackend.config;

import com.proctor.proctorbackend.auth.JwtBlacklistService;
import com.proctor.proctorbackend.auth.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

/**
 * Validates JWT on STOMP CONNECT frames.
 * Token must be passed as a STOMP header: Authorization: Bearer <token>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final JwtBlacklistService jwtBlacklistService;
    private final UserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or invalid Authorization header on WebSocket CONNECT");
            }
            String token = authHeader.substring(7);
            if (jwtBlacklistService.isBlacklisted(token)) {
                throw new IllegalArgumentException("JWT token has been logged out");
            }

            try {
                String email = jwtService.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                if (!jwtService.isTokenValid(token, userDetails)) {
                    throw new IllegalArgumentException("Invalid JWT token on WebSocket CONNECT");
                }

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                accessor.setUser(auth);
                log.debug("WebSocket authenticated: {}", email);
            } catch (JwtException | IllegalArgumentException | UsernameNotFoundException ex) {
                throw new IllegalArgumentException("Invalid JWT token on WebSocket CONNECT", ex);
            }
        }
        return message;
    }
}
