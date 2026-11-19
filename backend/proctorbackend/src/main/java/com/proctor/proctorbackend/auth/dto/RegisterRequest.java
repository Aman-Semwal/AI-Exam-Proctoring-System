package com.proctor.proctorbackend.auth.dto;

import com.proctor.proctorbackend.common.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for {@code POST /api/auth/register}.
 *
 * <p>{@code orgId} is optional: it is required for all roles except {@code SUPER_ADMIN}.
 * A {@code SUPER_ADMIN} registers via a one-time platform setup endpoint and has no org.
 * The application service validates the orgId presence based on the requested role.
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 128, message = "Password must be between 8 and 128 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    /**
     * Organization ID the new user belongs to.
     * Required for all roles except {@code SUPER_ADMIN}.
     * {@code null} is accepted for SUPER_ADMIN self-registration.
     */
    private Long orgId;
}
