package com.proctor.proctorbackend.question.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {

    private Long id;
    private Long examId;
    private String questionText;
    private Map<String, String> options;

    /**
     * Correct option is only exposed to roles that are allowed to see answers
     * (EXAMINER / ADMIN). Students receive this as null — enforced in the service layer.
     */
    private String correctOption;

    private Integer marks;
    private LocalDateTime createdAt;
}
