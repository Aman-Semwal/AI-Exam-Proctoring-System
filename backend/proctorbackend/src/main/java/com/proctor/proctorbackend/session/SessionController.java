package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.session.dto.SessionRequest;
import com.proctor.proctorbackend.session.dto.SessionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Exam session management")
@SecurityRequirement(name = "bearerAuth")
public class SessionController {

    private final SessionService sessionService;

    @PostMapping("/start")
    @Operation(summary = "Start an exam session")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<SessionResponse>> startSession(
            @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionResponse response = sessionService.startSession(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Session started", response));
    }

    @PutMapping("/{id}/end")
    @Operation(summary = "End an exam session")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<SessionResponse>> endSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionResponse response = sessionService.endSession(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Session ended", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Session fetched",
                sessionService.getSessionById(id, userDetails.getUsername())));
    }

    @GetMapping("/my")
    @Operation(summary = "Get all my sessions as student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getMySessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Sessions fetched",
                sessionService.getMySessionsAsStudent(userDetails.getUsername())));
    }

    @GetMapping("/exam/{examId}")
    @Operation(summary = "Get all sessions for an exam (proctor/admin view)")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionsByExam(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Sessions fetched",
                sessionService.getSessionsByExam(examId, userDetails.getUsername())));
    }
}
