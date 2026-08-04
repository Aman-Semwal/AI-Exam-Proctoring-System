package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;
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
@RequestMapping("/api/questions")
@RequiredArgsConstructor
@Tag(name = "Questions", description = "Exam question management")
@SecurityRequirement(name = "bearerAuth")
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @Operation(summary = "Add a question to an exam")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuestionResponse>> createQuestion(
            @Valid @RequestBody QuestionRequest request) {
        QuestionResponse response = questionService.createQuestion(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question created", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a question by ID (correct answer hidden for students)")
    public ResponseEntity<ApiResponse<QuestionResponse>> getQuestion(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeAnswer) {
        return ResponseEntity.ok(
                ApiResponse.success("Question fetched", questionService.getQuestionById(id, includeAnswer)));
    }

    @GetMapping("/exam/{examId}")
    @Operation(summary = "Get all questions for an exam")
    public ResponseEntity<ApiResponse<List<QuestionResponse>>> getByExam(
            @PathVariable Long examId,
            @RequestParam(defaultValue = "false") boolean includeAnswer) {
        return ResponseEntity.ok(
                ApiResponse.success("Questions fetched",
                        questionService.getQuestionsByExam(examId, includeAnswer)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a question")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<QuestionResponse>> updateQuestion(
            @PathVariable Long id,
            @Valid @RequestBody QuestionRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Question updated", questionService.updateQuestion(id, request)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a question")
    @PreAuthorize("hasRole('EXAMINER') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable Long id) {
        questionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Question deleted"));
    }
}
