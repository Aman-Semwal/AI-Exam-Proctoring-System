package com.proctor.proctorbackend.violation.dto;

import com.proctor.proctorbackend.violation.ReviewOutcome;
import lombok.Data;

@Data
public class ReviewRequest {

    /** CONFIRMED or DISMISSED (false positive). Omitted → CONFIRMED. */
    private ReviewOutcome outcome;
}
