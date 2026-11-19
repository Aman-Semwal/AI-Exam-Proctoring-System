package com.proctor.proctorbackend.coderunner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestCaseResult {
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private boolean passed;
    private String error;
}
