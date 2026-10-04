package com.proctor.proctorbackend.violation;

/** A proctor's decision on a flagged violation. DISMISSED violations don't affect the trust score. */
public enum ReviewOutcome {
    CONFIRMED,
    DISMISSED
}
