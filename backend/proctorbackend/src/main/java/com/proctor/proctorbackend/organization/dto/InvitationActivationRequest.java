package com.proctor.proctorbackend.organization.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class InvitationActivationRequest {

    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Token is required")
    private String token;

    @NotBlank(message = "Password is required")
    private String password;
}
