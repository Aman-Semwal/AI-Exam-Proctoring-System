package com.proctor.proctorbackend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configures the STOMP over WebSocket message broker for real-time proctoring alerts.
 *
 * <p>Topology:
 * <ul>
 *   <li>Clients connect to {@code /ws} (with SockJS fallback for environments that
 *       block WebSocket upgrades).</li>
 *   <li>Broadcast subscriptions use the {@code /topic} prefix
 *       (e.g. {@code /topic/alerts/{examId}}).</li>
 *   <li>Client-to-server messages are prefixed with {@code /app}
 *       (routed to {@code @MessageMapping} methods).</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * Configures the in-memory simple message broker.
     *
     * @param registry the {@link MessageBrokerRegistry} to configure
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to /topic/... for broadcast messages
        registry.enableSimpleBroker("/topic");
        // Server-side @MessageMapping methods are prefixed with /app
        registry.setApplicationDestinationPrefixes("/app");
    }

    /**
     * Registers the STOMP endpoint with SockJS fallback.
     *
     * @param registry the {@link StompEndpointRegistry} to configure
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
