package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;
import com.proctor.proctorbackend.common.response.ApiResponse;
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
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Tag(name = "Exam Assignments", description = "Assign students to exams")
@SecurityRequirement(name = "bearerAuth")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @PostMapping
    @Operation(summary = "Assign a student to an exam")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> assignStudent(
            @Valid @RequestBody AssignmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AssignmentResponse response = assignmentService.assignStudent(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student assigned to exam", response));
    }

    @GetMapping("/exam/{examId}")
    @Operation(summary = "Get all assignments for an exam")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getByExam(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ApiResponse.success("Assignments fetched",
                        assignmentService.getAssignmentsByExam(examId, userDetails.getUsername())));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get all exam assignments for a student")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getByStudent(
            @PathVariable Long studentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ApiResponse.success("Assignments fetched",
                        assignmentService.getAssignmentsByStudent(studentId, userDetails.getUsername())));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a student assignment")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        assignmentService.removeAssignment(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Assignment removed"));
    }
}
