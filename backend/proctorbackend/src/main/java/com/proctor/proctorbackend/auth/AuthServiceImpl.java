package com.proctor.proctorbackend.auth;

import com.proctor.proctorbackend.auth.dto.AuthResponse;
import com.proctor.proctorbackend.auth.dto.LoginRequest;
import com.proctor.proctorbackend.auth.dto.RegisterRequest;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.organization.OrganizationRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * Concrete implementation of {@link AuthService}.
 *
 * <p>Handles user registration and login, delegating password encoding to
 * Spring Security's {@link PasswordEncoder} and token creation to {@link JwtService}.
 *
 * <p>Multi-tenant claims ({@code userId}, {@code role}, {@code orgId}, {@code orgSlug})
 * are embedded in every issued JWT so downstream services can perform tenant scoping
 * without an extra database round-trip.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Registers a new user account.
     *
     * <p>Steps:
     * <ol>
     *   <li>Check that the email is not already taken.</li>
     *   <li>Resolve organization (required for all roles except SUPER_ADMIN).</li>
     *   <li>Encode the plain-text password with BCrypt.</li>
     *   <li>Persist the new {@link User} entity.</li>
     *   <li>Generate and return a signed JWT with multi-tenant claims.</li>
     * </ol>
     *
     * @param request the registration payload (name, email, password, role, orgId)
     * @return {@link AuthResponse} containing the JWT and user + org details
     * @throws BadRequestException       if the email is already registered
     * @throws BadRequestException       if orgId is missing for a non-SUPER_ADMIN role
     * @throws ResourceNotFoundException if the provided orgId does not exist
     */
    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        authorizeRequestedRole(request);

        // Resolve organization — non-SUPER_ADMIN roles must belong to an active org.
        Organization org = null;
        if (request.getRole() != Role.SUPER_ADMIN) {
            if (request.getOrgId() == null) {
                throw new BadRequestException("orgId is required for role: " + request.getRole());
            }
            org = organizationRepository.findById(request.getOrgId())
                    .orElseThrow(() -> new ResourceNotFoundException("Organization", request.getOrgId()));
            if (!Boolean.TRUE.equals(org.getIsActive())) {
                throw new BadRequestException("Organization is inactive");
            }
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .organization(org)
                .build();

        userRepository.save(user);
            log.info("New user registered: id={} role={}", user.getId(), user.getRole());

        String token = jwtService.generateToken(buildClaims(user), user);

        return buildAuthResponse(token, user);
    }

    /**
     * Authenticates an existing user and returns a fresh JWT.
     *
     * @param request the login payload (email, password)
     * @return {@link AuthResponse} containing the JWT and user + org details
     * @throws BadRequestException if the user record cannot be found after authentication
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException on invalid credentials — caught by GlobalExceptionHandler
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getRole() != Role.SUPER_ADMIN) {
            Organization organization = user.getOrganization();
            if (organization == null || !Boolean.TRUE.equals(organization.getIsActive())) {
                throw new BadRequestException("Organization is inactive");
            }
        }

        log.info("User logged in: {}", user.getEmail());

        String token = jwtService.generateToken(buildClaims(user), user);

        return buildAuthResponse(token, user);
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Builds the extra claims map embedded in the JWT payload.
     * SUPER_ADMIN tokens carry {@code null} for orgId and orgSlug.
     */
    private Map<String, Object> buildClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId",  user.getId());
        claims.put("role",    user.getRole().name());
        claims.put("orgId",   user.getOrganization() != null ? user.getOrganization().getId()   : null);
        claims.put("orgSlug", user.getOrganization() != null ? user.getOrganization().getSlug() : null);
        return claims;
    }

    private void authorizeRequestedRole(RegisterRequest request) {
        if (request.getRole() == Role.SUPER_ADMIN) {
            if (request.getOrgId() != null) {
                throw new BadRequestException("orgId must be null for role: SUPER_ADMIN");
            }
            if (userRepository.count() != 0) {
                throw new BadRequestException("SUPER_ADMIN can only be created during the initial bootstrap");
            }
            return;
        }

        if (request.getRole() == Role.ORG_ADMIN) {
            throw new BadRequestException("ORG_ADMIN registration requires an authenticated admin or signed invitation");
        }
    }

    /** Constructs the {@link AuthResponse} from a freshly issued token and user entity. */
    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .orgId(user.getOrganization() != null ? user.getOrganization().getId()   : null)
                .orgSlug(user.getOrganization() != null ? user.getOrganization().getSlug() : null)
                .build();
    }
}
