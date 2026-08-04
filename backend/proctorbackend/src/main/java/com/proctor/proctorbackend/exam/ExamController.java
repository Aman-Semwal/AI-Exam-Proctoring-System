package com.proctor.proctorbackend.exam;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.exam.dto.ExamRequest;
import com.proctor.proctorbackend.exam.dto.ExamResponse;
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
@RequestMapping("/api/exams")
@RequiredArgsConstructor
@Tag(name = "Exams", description = "Exam management")
@SecurityRequirement(name = "bearerAuth")
public class ExamController {

    private final ExamService examService;

    @PostMapping
    @Operation(summary = "Create a new exam")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> createExam(
            @Valid @RequestBody ExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse response = examService.createExam(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Exam created successfully", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get exam by ID")
    public ResponseEntity<ApiResponse<ExamResponse>> getExam(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Exam fetched", examService.getExamById(id)));
    }

    @GetMapping
    @Operation(summary = "Get all exams")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getAllExams() {
        return ResponseEntity.ok(ApiResponse.success("Exams fetched", examService.getAllExams()));
    }

    @GetMapping("/my")
    @Operation(summary = "Get exams created by current examiner")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ExamResponse>>> getMyExams(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("My exams fetched",
                examService.getMyExams(userDetails.getUsername())));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an exam")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ExamResponse>> updateExam(
            @PathVariable Long id,
            @Valid @RequestBody ExamRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExamResponse response = examService.updateExam(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Exam updated", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an exam")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        examService.deleteExam(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Exam deleted"));
    }
}
