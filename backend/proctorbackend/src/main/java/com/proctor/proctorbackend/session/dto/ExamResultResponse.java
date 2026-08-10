package com.proctor.proctorbackend.session.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultResponse {

    private Long sessionId;
    private Long examId;
    private String examTitle;
    private String studentName;
    private String studentEmail;
    private String appliedRole;
    private String sessionStatus;

    private Integer score;
    private Integer totalMarks;
    private Double percentage;
    private String grade;

    private Integer totalQuestions;
    private Integer attempted;
    private Integer correct;
    private Integer incorrect;
    private Integer pendingReview;
    private Integer unattempted;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long timeTakenMinutes;

    private Long totalViolations;
    private Long criticalViolations;

    private List<QuestionResultDetail> breakdown;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResultDetail {
        private Long questionId;
        private String questionText;
        private String questionType;
        private Integer marks;
        private String selectedOption;
        private String textAnswer;
        private Boolean isCorrect;
    }
}
