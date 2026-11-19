package com.proctor.proctorbackend.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a requested entity cannot be found in the database.
 *
 * <p>Three constructor overloads for consistent, informative 404 messages:
 * <ul>
 *   <li>{@code (String resource, Long id)}    — "Exam not found with id: 5"</li>
 *   <li>{@code (String resource, String key)} — "User not found with email: a@b.com"</li>
 *   <li>{@code (String message)}              — free-form fallback</li>
 * </ul>
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {

    /** Free-form message — use sparingly; prefer the typed constructors below. */
    public ResourceNotFoundException(String message) {
        super(message);
    }

    /** e.g. new ResourceNotFoundException("Exam", 5L)  →  "Exam not found with id: 5" */
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id: " + id);
    }

    /** e.g. new ResourceNotFoundException("User", "ali@example.com")  →  "User not found: ali@example.com" */
    public ResourceNotFoundException(String resource, String identifier) {
        super(resource + " not found: " + identifier);
    }
}
