package com.proctor.proctorbackend.proctoring.dto;

import com.proctor.proctorbackend.violation.ViolationType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BrowserEventRequest {

    /** TAB_SWITCH or FULLSCREEN_EXIT; any other type is rejected. */
    @NotNull(message = "Event type is required")
    private ViolationType type;
}
