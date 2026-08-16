package com.proctor.proctorbackend.config;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.user.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

/**
 * Validates websocket destinations and exam alert subscriptions.
 * SUPER_ADMIN and ORG_ADMIN can subscribe to any exam's alerts.
 * PROCTOR subscriptions are allowed only when assigned to the exam.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketSubscriptionInterceptor implements ChannelInterceptor {

    private final ExamProctorService examProctorService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.SEND.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null) {
                if (destination.startsWith("/topic/")) {
                    throw new IllegalArgumentException("Client SEND frames cannot target broker destinations: " + destination);
                }
                if (!destination.startsWith("/app/")) {
                    throw new IllegalArgumentException("Client SEND frames must target application destinations: " + destination);
                }
            }
        }

        if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/alerts/")) {
                String examIdStr = destination.substring("/topic/alerts/".length());
                try {
                    Long examId = Long.parseLong(examIdStr);
                    if (!(accessor.getUser() instanceof org.springframework.security.authentication
                            .UsernamePasswordAuthenticationToken authToken)) {
                        throw new IllegalArgumentException("WebSocket user is not authenticated");
                    }
                    if (!(authToken.getPrincipal() instanceof User user)) {
                        throw new IllegalArgumentException("WebSocket principal is not a User instance");
                    }

                    if (user.getRole() == Role.PROCTOR) {
                        if (!examProctorService.isProctorAssignedToExam(user.getId(), examId)) {
                            throw new IllegalArgumentException(
                                    "Examiner " + user.getEmail() + " is not assigned to exam " + examId);
                        }
                    } else if (user.getRole() != Role.ORG_ADMIN && user.getRole() != Role.SUPER_ADMIN) {
                        throw new IllegalArgumentException(
                                "User " + user.getEmail() + " is not allowed to subscribe to exam " + examId);
                    }
                    log.debug("WebSocket subscription allowed: {} -> {}", user.getEmail(), destination);
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid examId in subscription destination: " + destination);
                }
            }
        }
        return message;
    }
}
