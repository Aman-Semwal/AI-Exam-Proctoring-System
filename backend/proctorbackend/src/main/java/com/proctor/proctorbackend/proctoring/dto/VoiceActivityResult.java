package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Mirrors Python {@code VoiceActivityResponse} from {@code app/models/audio.py}.
 *
 * <p>Present in {@link AnalyzeResponse#voiceActivity} only when
 * an {@code audio} chunk was included in the request. {@code null} otherwise.
 *
 * <p>Note: voice activity is <em>informational only</em> — the AI service does
 * not include it in the violation score (see {@code analysis_service.py} module
 * docstring point 2). It is surfaced here so a proctor reviewing session events
 * has the raw signal available.
 *
 * <pre>
 * speech_detected:   bool
 * speech_fraction:   float   (fraction of 32ms windows classified as speech)
 * mean_confidence:   float   (mean Silero VAD probability across all windows)
 * duration_seconds:  float   (total audio duration analyzed)
 * </pre>
 */
@Data
public class VoiceActivityResult {

    @JsonProperty("speech_detected")
    private boolean speechDetected;

    @JsonProperty("speech_fraction")
    private double speechFraction;

    @JsonProperty("mean_confidence")
    private double meanConfidence;

    @JsonProperty("duration_seconds")
    private double durationSeconds;
}
