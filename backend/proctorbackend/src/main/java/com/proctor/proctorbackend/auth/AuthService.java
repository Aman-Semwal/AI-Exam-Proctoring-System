package com.proctor.proctorbackend.auth;

import com.proctor.proctorbackend.auth.dto.AuthResponse;
import com.proctor.proctorbackend.auth.dto.LoginRequest;
import com.proctor.proctorbackend.auth.dto.RegisterRequest;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void logout(String token);
}
