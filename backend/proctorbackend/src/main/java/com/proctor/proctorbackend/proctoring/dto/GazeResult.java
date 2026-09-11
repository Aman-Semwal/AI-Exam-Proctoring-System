package com.proctor.proctorbackend.proctoring.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Mirrors Python {@code GazeInferenceResponse} from {@code app/models/gaze.py}.
 *
 * <pre>
 * face_detected:         bool
 * yaw:                   float | None   (left/right head turn, degrees)
 * pitch:                 float | None   (up/down tilt, degrees)
 * roll:                  float | None   (ear-to-shoulder tilt, degrees)
 * gaze_horizontal_ratio: float | None   (0.0=far-left, 0.5=center, 1.0=far-right)
 * looking_away:          bool
 * reason:                str | None     (comma-separated tags e.g. "head_turned,eyes_averted")
 * </pre>
 */
@Data
public class GazeResult {

    @JsonProperty("face_detected")
    private boolean faceDetected;

    private Double yaw;
    private Double pitch;
    private Double roll;

    @JsonProperty("gaze_horizontal_ratio")
    private Double gazeHorizontalRatio;

    @JsonProperty("looking_away")
    private boolean lookingAway;

    private String reason;
}
