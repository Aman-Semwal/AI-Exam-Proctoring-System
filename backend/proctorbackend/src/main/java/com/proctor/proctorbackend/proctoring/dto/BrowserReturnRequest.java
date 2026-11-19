package com.proctor.proctorbackend.proctoring.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Sent when the student comes back to the exam after a browser event. */
@Data
public class BrowserReturnRequest {

    @NotNull(message = "awaySeconds is required")
    @Min(0)
    @Max(86_400)
    private Integer awaySeconds;

    /** True if the exam tab was actually hidden while away (not just the window losing focus). */
    private boolean tabHidden;
}
