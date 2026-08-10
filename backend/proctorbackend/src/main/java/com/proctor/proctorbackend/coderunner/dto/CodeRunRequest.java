package com.proctor.proctorbackend.coderunner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CodeRunRequest {

    @NotBlank(message = "language is required")
    private String language;

    @NotBlank(message = "code is required")
    @Size(max = 100000, message = "code is too large")
    private String code;

    @NotNull(message = "testCases are required")
    @NotEmpty(message = "testCases cannot be empty")
    @Size(min = 1, max = 20, message = "testCases must contain between 1 and 20 items")
    private List<CodeRunTestCaseRequest> testCases;
}
