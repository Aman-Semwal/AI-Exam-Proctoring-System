package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;
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
@RequestMapping("/api/answers")
@RequiredArgsConstructor
@Tag(name = "Answers", description = "Submit and retrieve exam answers")
@SecurityRequirement(name = "bearerAuth")
public class AnswerController {

    private final AnswerService answerService;

    @PostMapping
    @Operation(summary = "Submit an answer for a question in an active session")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AnswerResponse>> submitAnswer(
            @Valid @RequestBody AnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        AnswerResponse response = answerService.submitAnswer(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Answer submitted", response));
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Get all answers for a session")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<AnswerResponse>>> getBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(
                ApiResponse.success("Answers fetched", answerService.getAnswersBySession(sessionId)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific answer by ID")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN', 'STUDENT')")
    public ResponseEntity<ApiResponse<AnswerResponse>> getAnswer(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.success("Answer fetched", answerService.getAnswerById(id)));
    }

    @PatchMapping("/{id}/grade")
    @Operation(summary = "Manually grade a CODING or DESCRIPTIVE answer")
    @PreAuthorize("hasAnyRole('EXAM_CREATOR', 'PROCTOR', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<AnswerResponse>> gradeAnswer(
            @PathVariable Long id,
            @RequestParam Boolean isCorrect,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                ApiResponse.success("Answer graded", answerService.gradeAnswer(id, isCorrect, userDetails.getUsername())));
    }
}
