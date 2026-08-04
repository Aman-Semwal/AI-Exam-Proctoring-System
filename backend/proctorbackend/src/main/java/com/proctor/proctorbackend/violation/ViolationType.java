package com.proctor.proctorbackend.violation;

/**
 * Categorises the type of proctoring violation detected during an exam session.
 */
public enum ViolationType {
    NO_FACE_DETECTED,
    MULTIPLE_FACES_DETECTED,
    TAB_SWITCH,
    FULLSCREEN_EXIT,
    PHONE_DETECTED,
    OTHER
}
