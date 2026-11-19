package com.proctor.proctorbackend.examexaminer;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentRequest;
import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentResponse;
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
@RequestMapping("/api/exams/{examId}/examiners")
@RequiredArgsConstructor
@Tag(name = "Examiner Assignments", description = "Assign/remove examiners to exams")
@SecurityRequirement(name = "bearerAuth")
public class ExamExaminerController {

    private final ExamExaminerService examinerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Assign an examiner to an exam")
    public ResponseEntity<ApiResponse<ExaminerAssignmentResponse>> assign(
            @PathVariable Long examId,
            @Valid @RequestBody ExaminerAssignmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Examiner assigned",
                examinerService.assignExaminer(examId, request, userDetails.getUsername())));
    }

    @DeleteMapping("/{examinerId}")
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
    @Operation(summary = "Remove an examiner from an exam")
    public ResponseEntity<ApiResponse<Void>> remove(
            @PathVariable Long examId,
            @PathVariable Long examinerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        examinerService.removeExaminer(examId, examinerId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Examiner removed", null));
    }

    @GetMapping
    @Operation(summary = "List all examiners assigned to an exam")
    @PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN','EXAM_CREATOR')")
    public ResponseEntity<ApiResponse<List<ExaminerAssignmentResponse>>> list(
            @PathVariable Long examId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Examiners fetched",
                examinerService.getExaminersByExam(examId, userDetails.getUsername())));
    }
}
