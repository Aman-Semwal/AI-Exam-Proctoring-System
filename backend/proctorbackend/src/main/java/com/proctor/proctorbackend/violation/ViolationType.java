package com.proctor.proctorbackend.violation;

/**
 * Categorises the type of proctoring violation detected during an exam session.
 *
 * <h3>AI-service mapping</h3>
 * The Python {@code Violation} enum in {@code app/models/analysis.py} uses
 * lowercase snake_case strings. The mapping to this Java enum is done in
 * {@code ProctoringServiceImpl.mapAiViolation()}:
 *
 * <pre>
 *   "no_face"             → NO_FACE_DETECTED
 *   "multiple_faces"      → MULTIPLE_FACES_DETECTED
 *   "looking_away"        → LOOKING_AWAY          (added — was missing)
 *   "unauthorized_object" → UNAUTHORIZED_OBJECT   (added — was missing; replaces PHONE_DETECTED)
 *   "identity_mismatch"   → IDENTITY_MISMATCH     (added — was missing)
 * </pre>
 *
 * <h3>Client-side / manual violations</h3>
 * {@code TAB_SWITCH} and {@code FULLSCREEN_EXIT} are detected by the frontend
 * and recorded via {@code POST /api/violations} — they never come from the AI service.
 *
 * {@code OTHER} is used by proctors for manual violation entries.
 */
public enum ViolationType {

    // ── AI-detected ───────────────────────────────────────────────────────

    /** Face count = 0 in the current frame. AI severity: HIGH (15 pts). */
    NO_FACE_DETECTED,

    /** Face count > 1 in the current frame. AI severity: CRITICAL (25 pts). */
    MULTIPLE_FACES_DETECTED,

    /**
     * Head or gaze deviated beyond threshold (yaw > 25°, pitch > 20°, or iris
     * ratio outside [0.35, 0.65]). AI severity: LOW (10 pts).
     * Only raised when exactly one face is present to avoid double-counting
     * a "no face" event as both NO_FACE and LOOKING_AWAY.
     */
    LOOKING_AWAY,

    /**
     * An exam-integrity watchlist object detected in frame (cell phone, book,
     * remote control — see {@code object_service._WATCHLIST}).
     * AI severity: CRITICAL (30 pts).
     * Replaces the former {@code PHONE_DETECTED} which was too narrow
     * (YOLOv8n can detect books, remotes, etc., not just phones).
     */
    UNAUTHORIZED_OBJECT,

    /**
     * The face in the current frame does not match the enrolled reference
     * embedding (cosine similarity below threshold 0.38). AI severity: CRITICAL (40 pts).
     * Only raised when a reference embedding was supplied in the request.
     */
    IDENTITY_MISMATCH,

    // ── Client/frontend-detected ──────────────────────────────────────────

    /** Student switched browser tab during the exam. Detected by the frontend. */
    TAB_SWITCH,

    /** Student exited fullscreen mode during the exam. Detected by the frontend. */
    FULLSCREEN_EXIT,

    // ── Manual ────────────────────────────────────────────────────────────

    /** Manually recorded by a proctor for miscellaneous observations. */
    OTHER
}
