package com.proctor.proctorbackend.coderunner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CodeRunTestCaseRequest {

    @NotBlank(message = "test case input is required")
    @Size(max = 4000, message = "test case input is too large")
    private String input;

    @NotBlank(message = "test case expectedOutput is required")
    @Size(max = 4000, message = "test case expectedOutput is too large")
    private String expectedOutput;
}