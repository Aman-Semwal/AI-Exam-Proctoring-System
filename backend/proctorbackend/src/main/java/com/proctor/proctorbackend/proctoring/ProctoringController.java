package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.proctoring.dto.FrameUploadRequest;
import com.proctor.proctorbackend.proctoring.dto.ProctoringEventResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proctor")
@RequiredArgsConstructor
@Tag(name = "Proctoring", description = "AI-powered exam proctoring")
@SecurityRequirement(name = "bearerAuth")
public class ProctoringController {

    private final ProctoringService proctoringService;

    @PostMapping("/frame")
    @Operation(summary = "Submit a webcam frame for face detection analysis")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ProctoringEventResponse>> submitFrame(
            @Valid @RequestBody FrameUploadRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ProctoringEventResponse response = proctoringService.processFrame(
                request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Frame processed", response));
    }

    @GetMapping("/session/{sessionId}/events")
    @Operation(summary = "Get all proctoring events for a session")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ProctoringEventResponse>>> getSessionEvents(
            @PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success("Events fetched",
                proctoringService.getEventsBySession(sessionId)));
    }
}
