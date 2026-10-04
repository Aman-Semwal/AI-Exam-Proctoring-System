package com.proctor.proctorbackend.proctoring;

/**
 * Thrown when the AI service cannot be reached for a call that has no safe
 * fallback (e.g. reference-photo enrollment). Mapped to HTTP 503.
 */
public class AiServiceUnavailableException extends RuntimeException {

    public AiServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
