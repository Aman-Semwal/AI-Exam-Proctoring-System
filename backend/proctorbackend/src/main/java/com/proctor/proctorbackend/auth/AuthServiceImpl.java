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
import com.proctor.proctorbackend.user.InvitationStatus;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Concrete implementation of {@link AuthService}.
 *
 * <h3>Entry points by role</h3>
 * <ul>
 *   <li><b>SUPER_ADMIN</b> — {@code POST /api/auth/register} (one-time platform bootstrap
 *       only; rejected if any user already exists).</li>
 *   <li><b>All other roles</b> — invited via {@code POST /api/organizations/{id}/members},
 *       then activated via {@code POST /api/organizations/invitations/activate}.
 *       They never go through {@code /api/auth/register}.</li>
 * </ul>
 *
 * <p>Multi-tenant claims ({@code userId}, {@code role}, {@code orgId}, {@code orgSlug})
 * are embedded in every issued JWT so downstream services can perform tenant scoping
 * without an extra database round-trip.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository         userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder        passwordEncoder;
    private final JwtService             jwtService;
    private final AuthenticationManager  authenticationManager;
    private final JwtBlacklistService    jwtBlacklistService;

    // -----------------------------------------------------------------------
    // Register — SUPER_ADMIN bootstrap only
    // -----------------------------------------------------------------------

    /**
     * Registers the platform-level {@code SUPER_ADMIN} account.
     *
     * <p>This endpoint exists exclusively for the one-time platform bootstrap:
     * it is rejected when any user already exists in the database, ensuring only
     * one SUPER_ADMIN can ever be created this way.
     *
     * <p>All other roles (ORG_ADMIN, EXAM_CREATOR, PROCTOR, STUDENT) are onboarded
     * through the invitation flow — {@code POST /api/organizations/{id}/members} followed
     * by {@code POST /api/organizations/invitations/activate}.
     *
     * @param request the registration payload (name, email, password, role=SUPER_ADMIN, orgId=null)
     * @return {@link AuthResponse} containing the JWT and user details
     * @throws BadRequestException if role is not SUPER_ADMIN, email is already taken,
     *                             orgId is supplied for SUPER_ADMIN, or database is not empty
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Only SUPER_ADMIN may self-register — all other roles use the invitation flow
        if (request.getRole() != Role.SUPER_ADMIN) {
            throw new BadRequestException(
                    "Self-registration is not available for role '" + request.getRole()
                    + "'. Please use the invitation link sent to your email.");
        }

        // SUPER_ADMIN must not be scoped to any organization
        if (request.getOrgId() != null) {
            throw new BadRequestException("orgId must be null for role: SUPER_ADMIN");
        }

        // One-time bootstrap guard — only allowed when the database has zero users
        if (userRepository.count() != 0) {
            throw new BadRequestException(
                    "SUPER_ADMIN account already exists. "
                    + "Platform bootstrap is a one-time operation.");
        }

        // Email uniqueness (defensive — count check above covers it for bootstrap)
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.SUPER_ADMIN)
                .organization(null)          // SUPER_ADMIN has no org scope
                .invitationStatus(InvitationStatus.ACTIVE)
                .build();

        userRepository.save(user);
        log.info("SUPER_ADMIN bootstrapped: email={}", user.getEmail());

        String token = jwtService.generateToken(buildClaims(user), user);
        return buildAuthResponse(token, user);
    }

    // -----------------------------------------------------------------------
    // Login
    // -----------------------------------------------------------------------

    /**
     * Authenticates an existing user and returns a fresh JWT.
     *
     * <p>Login is blocked for users whose invitation is still {@code PENDING}
     * (they must activate their account first) and for users whose organization
     * has been deactivated.
     *
     * @param request the login payload (email, password)
     * @return {@link AuthResponse} containing the JWT and user + org details
     * @throws BadRequestException       if the user record cannot be found after authentication
     * @throws BadRequestException       if the account invitation is still pending
     * @throws BadRequestException       if the user's organization is inactive
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        // Throws BadCredentialsException on invalid credentials — caught by GlobalExceptionHandler → 401
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getEmail()));

        // Invited users must activate their account before they can log in
        if (user.getInvitationStatus() == InvitationStatus.PENDING) {
            throw new BadRequestException(
                    "Account activation is pending. "
                    + "Please check your email and click the activation link.");
        }

        // Non-SUPER_ADMIN users must belong to an active organization
        if (user.getRole() != Role.SUPER_ADMIN) {
            Organization org = user.getOrganization();
            if (org == null || !Boolean.TRUE.equals(org.getIsActive())) {
                throw new BadRequestException(
                        "Your organization account is inactive. "
                        + "Please contact your administrator.");
            }
        }

        log.info("User logged in: email={} role={}", user.getEmail(), user.getRole());

        String token = jwtService.generateToken(buildClaims(user), user);
        return buildAuthResponse(token, user);
    }

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------

    /**
     * Invalidates a JWT by storing it in the Redis blacklist until it naturally expires.
     *
     * <p>TTL = token expiry − now. Redis auto-evicts the key when the token would have
     * expired anyway — no manual cleanup needed. Lookup in {@link JwtAuthFilter} is O(1).
     *
     * @param token the raw JWT string from the Authorization header (without "Bearer " prefix)
     */
    @Override
    public void logout(String token) {
        try {
            Date expiry    = jwtService.getExpirationDate(token);
            long ttlMillis = expiry.getTime() - System.currentTimeMillis();
            if (ttlMillis > 0) {
                jwtBlacklistService.blacklist(token, Duration.ofMillis(ttlMillis));
                log.info("Token blacklisted, expires in {}ms", ttlMillis);
            }
        } catch (Exception ex) {
            // Token may already be expired — no action needed
            log.warn("Logout: could not blacklist token — {}", ex.getMessage());
        }
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Builds the extra JWT claims map.
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

    private AuthResponse buildAuthResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .orgId(user.getOrganization()   != null ? user.getOrganization().getId()   : null)
                .orgSlug(user.getOrganization() != null ? user.getOrganization().getSlug() : null)
                .build();
    }
}
