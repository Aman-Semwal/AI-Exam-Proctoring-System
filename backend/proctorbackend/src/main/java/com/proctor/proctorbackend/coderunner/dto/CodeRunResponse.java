package com.proctor.proctorbackend.coderunner.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CodeRunResponse {
    private int totalTests;
    private int passed;
    private int failed;
    private List<TestCaseResult> results;
}
