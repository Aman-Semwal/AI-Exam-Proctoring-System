package com.proctor.proctorbackend.auth;

import com.proctor.proctorbackend.auth.dto.AuthResponse;
import com.proctor.proctorbackend.auth.dto.LoginRequest;
import com.proctor.proctorbackend.auth.dto.RegisterRequest;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Concrete implementation of {@link AuthService}.
 *
 * <p>Handles user registration and login, delegating password encoding to
 * Spring Security's {@link org.springframework.security.crypto.password.PasswordEncoder}
 * and token creation to {@link JwtService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new user account.
     *
     * <p>Steps:
     * <ol>
     *   <li>Check that the email is not already taken.</li>
     *   <li>Encode the plain-text password with BCrypt.</li>
     *   <li>Persist the new {@link com.proctor.proctorbackend.user.User} entity.</li>
     *   <li>Generate and return a signed JWT alongside basic profile info.</li>
     * </ol>
     *
     * @param request the registration payload (name, email, password, role)
     * @return {@link AuthResponse} containing the JWT token and user details
     * @throws com.proctor.proctorbackend.common.exception.BadRequestException
     *         if the email is already registered
     */
    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);
        log.info("New user registered: {}", user.getEmail());

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    /**
     * Authenticates an existing user and returns a fresh JWT.
     *
     * <p>Authentication is delegated to Spring Security's {@link AuthenticationManager}.
     * A {@link org.springframework.security.authentication.BadCredentialsException} is thrown
     * automatically on invalid credentials and is caught by
     * {@link com.proctor.proctorbackend.common.exception.GlobalExceptionHandler}.
     *
     * @param request the login payload (email, password)
     * @return {@link AuthResponse} containing the JWT token and user details
     * @throws com.proctor.proctorbackend.common.exception.BadRequestException
     *         if the user record cannot be found after successful authentication
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException if invalid — handled by GlobalExceptionHandler
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        log.info("User logged in: {}", user.getEmail());

        String token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }
}
