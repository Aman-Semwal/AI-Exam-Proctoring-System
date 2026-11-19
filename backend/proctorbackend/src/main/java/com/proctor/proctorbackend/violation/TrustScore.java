package com.proctor.proctorbackend.violation;

/** Trust score (0–100) of an exam session, with its band. */
public record TrustScore(int score, TrustLevel level) {
}
