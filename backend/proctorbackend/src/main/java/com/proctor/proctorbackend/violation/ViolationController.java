package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.violation.dto.ViolationRequest;
import com.proctor.proctorbackend.violation.dto.ViolationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/violations")
@RequiredArgsConstructor
@Tag(name = "Violations", description = "Proctoring violation management")
@SecurityRequirement(name = "bearerAuth")
public class ViolationController {

    private final ViolationService violationService;

    @PostMapping
    @Operation(summary = "Record a new violation for a session")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ViolationResponse>> recordViolation(
            @Valid @RequestBody ViolationRequest request) {
        ViolationResponse response = violationService.recordViolation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Violation recorded", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a violation by ID")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ViolationResponse>> getViolation(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Violation fetched", violationService.getViolationById(id)));
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Get all violations for a session")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ViolationResponse>>> getBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(
                ApiResponse.success("Violations fetched", violationService.getViolationsBySession(sessionId)));
    }

    @GetMapping("/session/{sessionId}/unreviewed")
    @Operation(summary = "Get unreviewed violations for a session")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ViolationResponse>>> getUnreviewed(@PathVariable Long sessionId) {
        return ResponseEntity.ok(
                ApiResponse.success("Unreviewed violations fetched",
                        violationService.getUnreviewedBySession(sessionId)));
    }

    @PatchMapping("/{id}/review")
    @Operation(summary = "Mark a violation as reviewed")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ViolationResponse>> markReviewed(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Violation marked as reviewed", violationService.markReviewed(id)));
    }
}
