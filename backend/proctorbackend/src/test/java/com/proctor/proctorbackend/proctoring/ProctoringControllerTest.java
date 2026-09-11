package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ProctoringController}.
 *
 * Pure Mockito slice — no Spring context, no MockMvc, no @WebMvcTest.
 * Tests the controller's delegation logic and HTTP response wrapping.
 * Security rules (@PreAuthorize) are tested separately in integration tests.
 */
@ExtendWith(MockitoExtension.class)
class ProctoringControllerTest {

    @Mock
    ProctoringService proctoringService;

    @InjectMocks
    ProctoringController controller;

    UserDetails studentUser;

    @BeforeEach
    void setUp() {
        studentUser = User.withUsername("student@test.com")
                .password("irrelevant")
                .roles("STUDENT")
                .build();
    }

    // -----------------------------------------------------------------------
    // submitFrame
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("submitFrame — delegates to proctoringService and returns 200 with event data")
    void submitFrame_validRequest_returns200WithEventData() {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(55L);
        req.setFrameBase64("base64frame==");

        ProctoringEventResponse expected = ProctoringEventResponse.builder()
                .id(1L)
                .sessionId(55L)
                .eventType(ProctoringEvent.EventType.FACE_DETECTED)
                .details("1 face detected")
                .faceCount(1)
                .detectedAt(LocalDateTime.now())
                .build();

        when(proctoringService.processFrame(any(FrameUploadRequest.class), eq("student@test.com")))
                .thenReturn(expected);

        ResponseEntity<ApiResponse<ProctoringEventResponse>> response =
                controller.submitFrame(req, studentUser);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(expected, response.getBody().getData());

        verify(proctoringService, times(1)).processFrame(req, "student@test.com");
    }

    @Test
    @DisplayName("submitFrame — passes the authenticated username to the service")
    void submitFrame_usesAuthenticatedUsername() {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(55L);
        req.setFrameBase64("frame==");

        ProctoringEventResponse stub = ProctoringEventResponse.builder()
                .id(1L).sessionId(55L)
                .eventType(ProctoringEvent.EventType.FACE_DETECTED)
                .faceCount(1).build();

        when(proctoringService.processFrame(any(), eq("student@test.com"))).thenReturn(stub);

        controller.submitFrame(req, studentUser);

        // Verify the email extracted from UserDetails is forwarded correctly
        verify(proctoringService).processFrame(req, "student@test.com");
    }

    @Test
    @DisplayName("submitFrame — propagates RuntimeException from service (no swallowing)")
    void submitFrame_serviceThrows_propagatesException() {
        FrameUploadRequest req = new FrameUploadRequest();
        req.setSessionId(55L);
        req.setFrameBase64("frame==");

        when(proctoringService.processFrame(any(), any()))
                .thenThrow(new IllegalStateException("Session is not active"));

        assertThrows(IllegalStateException.class,
                () -> controller.submitFrame(req, studentUser));
    }

    // -----------------------------------------------------------------------
    // getSessionEvents
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("getSessionEvents — delegates to service and returns 200 with event list")
    void getSessionEvents_authorizedUser_returns200WithList() {
        UserDetails adminUser = User.withUsername("admin@test.com")
                .password("irrelevant")
                .roles("ORG_ADMIN")
                .build();

        ProctoringEventResponse ev = ProctoringEventResponse.builder()
                .id(1L).sessionId(55L)
                .eventType(ProctoringEvent.EventType.NO_FACE_DETECTED)
                .details("No face detected")
                .faceCount(0)
                .detectedAt(LocalDateTime.now())
                .build();

        when(proctoringService.getEventsBySession(eq(55L), eq("admin@test.com")))
                .thenReturn(List.of(ev));

        ResponseEntity<ApiResponse<List<ProctoringEventResponse>>> response =
                controller.getSessionEvents(55L, adminUser);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().isSuccess());
        assertEquals(1, response.getBody().getData().size());
        assertEquals(ProctoringEvent.EventType.NO_FACE_DETECTED,
                response.getBody().getData().get(0).getEventType());
    }

    @Test
    @DisplayName("getSessionEvents — returns empty list when no events exist")
    void getSessionEvents_noEvents_returnsEmptyList() {
        UserDetails adminUser = User.withUsername("admin@test.com")
                .password("irrelevant")
                .roles("ORG_ADMIN")
                .build();

        when(proctoringService.getEventsBySession(eq(55L), eq("admin@test.com")))
                .thenReturn(Collections.emptyList());

        ResponseEntity<ApiResponse<List<ProctoringEventResponse>>> response =
                controller.getSessionEvents(55L, adminUser);

        assertNotNull(response.getBody());
        assertTrue(response.getBody().getData().isEmpty());
    }

    @Test
    @DisplayName("getSessionEvents — uses authenticated username from UserDetails")
    void getSessionEvents_usesAuthenticatedUsername() {
        UserDetails proctor = User.withUsername("proctor@test.com")
                .password("irrelevant")
                .roles("PROCTOR")
                .build();

        when(proctoringService.getEventsBySession(eq(10L), eq("proctor@test.com")))
                .thenReturn(Collections.emptyList());

        controller.getSessionEvents(10L, proctor);

        verify(proctoringService).getEventsBySession(10L, "proctor@test.com");
    }
}
