package com.proctor.proctorbackend.violation;

public enum TrustLevel {
    /** 80–100 */
    TRUSTED,
    /** 50–79 — a reviewer should look at the evidence */
    REVIEW,
    /** 0–49 */
    SUSPICIOUS;

    public static TrustLevel of(int score) {
        if (score >= 80) return TRUSTED;
        if (score >= 50) return REVIEW;
        return SUSPICIOUS;
    }
}
