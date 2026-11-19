package com.proctor.proctorbackend.examproctor;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentRequest;
import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentResponse;
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
@RequestMapping("/api/exams/{examId}/proctors")
@RequiredArgsConstructor
@Tag(name = "Proctor Assignments", description = "Assign/remove examiners to exams")
@SecurityRequirement(name = "bearerAuth")
public class ExamProctorController {

    private final ExamProctorService proctorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Assign an examiner to an exam")
    public ResponseEntity<ApiResponse<ProctorAssignmentResponse>> assign(
            @PathVariable Long examId,
            @Valid @RequestBody ProctorAssignmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Proctor assigned",
                proctorService.assignProctor(examId, request, userDetails.getUsername())));
    }

    @DeleteMapping("/{examinerId}")
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Remove an examiner from an exam")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long examId,
            @PathVariable Long examinerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        proctorService.removeProctor(examId, examinerId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Proctor removed", null));
    }

    @GetMapping
    @Operation(summary = "List all proctors assigned to an exam")
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<ProctorAssignmentResponse>>> list(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Proctors fetched",
                proctorService.getProctorsByExam(examId, userDetails.getUsername())));
    }
}
