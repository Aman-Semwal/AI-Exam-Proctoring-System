package com.proctor.proctorbackend.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard response wrapper used by every REST endpoint in the application.
 *
 * <p>All responses follow the same JSON shape:
 * <pre>{@code
 * {
 *   "success": true,
 *   "message": "Operation successful",
 *   "data": { ... }      // omitted when null (@JsonInclude NON_NULL)
 * }
 * }</pre>
 *
 * <p>Use the static factory methods rather than the builder directly:
 * <ul>
 *   <li>{@link #success(String, Object)} — response with a payload</li>
 *   <li>{@link #success(String)}         — action confirmed, no payload</li>
 *   <li>{@link #error(String)}           — error response</li>
 * </ul>
 *
 * @param <T> the type of the response payload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    /** Whether the operation succeeded. */
    private boolean success;

    /** Human-readable message describing the outcome. */
    private String message;

    /** The response payload; omitted from JSON when {@code null}. */
    private T data;

    /**
     * Creates a successful response with a payload.
     *
     * @param <T>     the payload type
     * @param message a human-readable success message
     * @param data    the response payload
     * @return a success {@link ApiResponse}
     */
    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    /**
     * Creates a successful response without a payload (e.g. for delete operations).
     *
     * @param <T>     the payload type (typically {@link Void})
     * @param message a human-readable success message
     * @return a success {@link ApiResponse} with no data field
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Creates an error response.
     *
     * @param <T>     the payload type (typically {@link Void})
     * @param message a human-readable error description
     * @return an error {@link ApiResponse} with no data field
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .build();
    }
}
