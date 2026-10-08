package com.proctor.proctorbackend.exam;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-exam proctoring configuration (columns on {@code exams}, see V26).
 * Also used as-is for the {@code proctoringRules} object in exam requests/responses.
 * The AI service always runs every detector; disabled checks are filtered server-side.
 */
@Embeddable
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctoringRules {

    /** Pre-exam reference photo + periodic identity verification. */
    @Builder.Default
    @Column(name = "identity_check_enabled", nullable = false)
    private boolean identityCheckEnabled = true;

    /** Mic capture; detected speech becomes a SPEECH_DETECTED violation. */
    @Builder.Default
    @Column(name = "audio_monitoring_enabled", nullable = false)
    private boolean audioMonitoringEnabled = true;

    /** LOOKING_AWAY violations. */
    @Builder.Default
    @Column(name = "gaze_tracking_enabled", nullable = false)
    private boolean gazeTrackingEnabled = true;

    /** UNAUTHORIZED_OBJECT violations. */
    @Builder.Default
    @Column(name = "object_detection_enabled", nullable = false)
    private boolean objectDetectionEnabled = true;

    /** Tab switches that auto-submit the exam; 0 = never auto-submit. */
    @Builder.Default
    @Min(0)
    @Max(20)
    @Column(name = "tab_switch_limit", nullable = false)
    private int tabSwitchLimit = 2;

    /** Attempts a student may make (submitted, auto-submitted and terminated all count). */
    @Builder.Default
    @Min(1)
    @Max(10)
    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 1;
}
