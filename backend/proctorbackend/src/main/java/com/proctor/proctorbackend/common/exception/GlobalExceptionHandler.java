package com.proctor.proctorbackend.common.exception;

import com.proctor.proctorbackend.common.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Centralised exception handler for all REST controllers.
 *
 * <p>Annotated with {@link RestControllerAdvice} so it applies globally without
 * any per-controller configuration. Each handler method maps a specific exception
 * type to an appropriate HTTP status code and a consistent {@link ApiResponse} body.
 *
 * <p>Security note: {@link org.springframework.security.authentication.BadCredentialsException}
 * is handled with a generic message to prevent user enumeration — the response
 * does not reveal whether the email exists.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Handles {@link ResourceNotFoundException} → HTTP 404 Not Found.
     *
     * @param ex the caught exception
     * @return error response with the exception message
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles {@link UnauthorizedException} → HTTP 401 Unauthorized.
     *
     * @param ex the caught exception
     * @return error response with the exception message
     */
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(UnauthorizedException ex) {
        log.warn("Unauthorized access attempt: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles {@link BadRequestException} → HTTP 400 Bad Request.
     *
     * @param ex the caught exception
     * @return error response with the exception message
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(BadRequestException ex) {
        log.warn("Bad request: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handles Spring Security's {@link org.springframework.security.authentication.BadCredentialsException}
     * → HTTP 401 Unauthorized with a generic message.
     *
     * @param ex the caught exception
     * @return generic "Invalid email or password" error response
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        // Generic message — do not reveal whether email exists
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Invalid email or password"));
    }

    /**
     * Handles Spring Security's {@link AccessDeniedException} → HTTP 403 Forbidden.
     *
     * @param ex the caught exception
     * @return "Access denied" error response
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("Access denied"));
    }

    /**
     * Handles {@link MethodArgumentNotValidException} → HTTP 400 Bad Request.
     *
     * <p>Returns a map of field names to their validation error messages so the
     * client knows exactly which fields failed and why.
     *
     * @param ex the caught validation exception
     * @return response with a {@code data} map of {@code { fieldName: errorMessage }}
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationErrors(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String message = error.getDefaultMessage();
            errors.put(fieldName, message);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Validation failed")
                        .data(errors)
                        .build());
    }

    /**
     * Catch-all handler for any unhandled exception → HTTP 500 Internal Server Error.
     *
     * <p>Logs the full stack trace at ERROR level for investigation.
     *
     * @param ex the caught exception
     * @return generic "unexpected error" response
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }
}
