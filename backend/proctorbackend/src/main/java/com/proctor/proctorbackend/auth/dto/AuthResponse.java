package com.proctor.proctorbackend.auth.dto;

import com.proctor.proctorbackend.common.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO returned on successful registration or login.
 *
 * <p>Contains the signed JWT plus enough profile and org context for the frontend
 * to store the current user's tenant scope without an additional API call.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    /** Signed JWT — include as {@code Authorization: Bearer <token>} on every request. */
    private String token;

    /** User's display name. */
    private String name;

    /** User's email (also the JWT subject). */
    private String email;

    /** The user's role in this organization. */
    private Role role;

    /**
     * The organization's numeric ID — used by the frontend to scope API calls.
     * {@code null} for SUPER_ADMIN (platform-level, no single org scope).
     */
    private Long orgId;

    /**
     * The organization's URL-safe slug — useful for human-readable references and routing.
     * {@code null} for SUPER_ADMIN.
     */
    private String orgSlug;
}
