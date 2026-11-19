package com.proctor.proctorbackend.websocket;

import com.proctor.proctorbackend.websocket.dto.AlertMessage;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * WebSocket controller for real-time proctoring alerts.
 *
 * Examiners subscribe to: /topic/alerts/{examId}
 * Alerts are pushed automatically by ProctoringServiceImpl via SimpMessagingTemplate.
 *
 * This controller also allows manual alert broadcasts if needed.
 */
@Controller
@RequiredArgsConstructor
@Tag(name = "WebSocket Alerts", description = "Real-time proctoring alert channel")
public class AlertController {

    @SuppressWarnings("unused")
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Examiners can subscribe to /topic/alerts/{examId} to receive real-time alerts.
     * This mapping handles manual messages sent from clients to /app/alerts/{examId}.
     */
    @MessageMapping("/alerts/{examId}")
    @SendTo("/topic/alerts/{examId}")
    public AlertMessage forwardAlert(
            @DestinationVariable Long examId,
            AlertMessage message) {
        return message;
    }
}
