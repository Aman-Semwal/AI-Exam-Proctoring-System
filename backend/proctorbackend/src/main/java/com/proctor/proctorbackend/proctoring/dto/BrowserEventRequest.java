package com.proctor.proctorbackend.proctoring.dto;

import com.proctor.proctorbackend.violation.ViolationType;
import com.proctor.proctorbackend.violation.BrowserSignal;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BrowserEventRequest {

    /** TAB_SWITCH or FULLSCREEN_EXIT; any other type is rejected. */
    @NotNull(message = "Event type is required")
    private ViolationType type;

    /** Which browser signal fired (optional; inferred from the type when absent). */
    private BrowserSignal signal;

    /** Webcam frame at the moment the student left (base64 JPEG, optional). */
    @Size(max = 2_000_000, message = "Snapshot is too large")
    private String snapshotBase64;
}
