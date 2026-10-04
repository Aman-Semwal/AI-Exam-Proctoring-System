package com.proctor.proctorbackend.proctoring.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BrowserEventResponse {

    /** Total TAB_SWITCH violations recorded for the session so far. */
    private long tabSwitchCount;

    /** True when this event pushed the session over the threshold and it was submitted. */
    private boolean autoSubmitted;
}
