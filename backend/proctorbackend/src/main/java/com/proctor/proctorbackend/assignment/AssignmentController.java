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
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> assignStudent(
            @Valid @RequestBody AssignmentRequest request) {
        AssignmentResponse response = assignmentService.assignStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student assigned to exam", response));
    }

    @GetMapping("/exam/{examId}")
    @Operation(summary = "Get all assignments for an exam")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getByExam(@PathVariable Long examId) {
        return ResponseEntity.ok(
                ApiResponse.success("Assignments fetched", assignmentService.getAssignmentsByExam(examId)));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Get all exam assignments for a student")
    @PreAuthorize("hasRole('ADMIN') or hasRole('EXAMINER') or hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getByStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(
                ApiResponse.success("Assignments fetched", assignmentService.getAssignmentsByStudent(studentId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove a student assignment")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeAssignment(@PathVariable Long id) {
        assignmentService.removeAssignment(id);
        return ResponseEntity.ok(ApiResponse.success("Assignment removed"));
    }
}
