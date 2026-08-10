package com.proctor.proctorbackend.organization;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.organization.dto.InviteMemberRequest;
import com.proctor.proctorbackend.organization.dto.InvitationActivationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationResponse;
import com.proctor.proctorbackend.mail.MailService;
import com.proctor.proctorbackend.user.InvitationStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int INVITATION_TTL_HOURS = 48;

    @Override
    @Transactional
    public OrganizationResponse createOrganization(OrganizationRequest request) {
        if (organizationRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Organization slug is already in use");
        }

        Organization organization = Organization.builder()
                .name(request.getName())
                .slug(request.getSlug())
                .plan(request.getPlan() != null ? request.getPlan() : "FREE")
                .isActive(true)
                .build();

        return toResponse(organizationRepository.save(organization));
    }

    @Override
    public List<OrganizationResponse> listAllOrganizations() {
        return organizationRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public OrganizationResponse getOrganization(Long id, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Organization organization = requireActiveOrganization(id);
        validateOrgAccess(requester, organization.getId());
        return toResponse(organization);
    }

    @Override
    public List<UserDto> listMembers(Long organizationId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Organization organization = requireActiveOrganization(organizationId);
        validateOrgAccess(requester, organization.getId());
        return userRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId).stream()
                .map(this::toUserDto)
                .toList();
    }

    @Override
    @Transactional
    public UserDto inviteMember(Long organizationId, InviteMemberRequest request, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Organization organization = requireActiveOrganization(organizationId);
        validateOrgAdminAccess(requester, organization.getId());

        if (request.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("SUPER_ADMIN cannot be invited into an organization");
        }

        User user = userRepository.findByEmail(request.getEmail()).orElseGet(() -> User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(generatePassword()))
                .role(request.getRole())
                .organization(organization)
                .invitationStatus(InvitationStatus.PENDING)
                .build());

        if (user.getInvitationStatus() != InvitationStatus.PENDING && user.getId() != null) {
            throw new BadRequestException("Email is already registered");
        }

        String token = generateActivationToken();
        user.setName(request.getName());
        user.setRole(request.getRole());
        user.setOrganization(organization);
        user.setInvitationStatus(InvitationStatus.PENDING);
        user.setInvitationTokenHash(passwordEncoder.encode(token));
        user.setInvitationTokenExpiresAt(LocalDateTime.now(ZoneId.of("UTC")).plusHours(INVITATION_TTL_HOURS));
        user.setInvitationAcceptedAt(null);

        User saved = userRepository.save(user);
        mailService.sendInvitationLink(saved.getEmail(), saved.getName(), buildActivationLink(saved.getEmail(), token),
                organization.getName(), saved.getRole().name());
        return toUserDto(saved);
    }

    @Override
    @Transactional
    public void activateInvitation(InvitationActivationRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (user.getInvitationStatus() != InvitationStatus.PENDING) {
            throw new BadRequestException("Invitation is no longer pending");
        }
        if (user.getInvitationTokenExpiresAt() == null
                || LocalDateTime.now(ZoneId.of("UTC")).isAfter(user.getInvitationTokenExpiresAt())) {
            throw new BadRequestException("Invitation token has expired");
        }
        if (user.getInvitationTokenHash() == null
                || !passwordEncoder.matches(request.getToken(), user.getInvitationTokenHash())) {
            throw new BadRequestException("Invalid invitation token");
        }

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setInvitationStatus(InvitationStatus.ACTIVE);
        user.setInvitationTokenHash(null);
        user.setInvitationTokenExpiresAt(null);
        user.setInvitationAcceptedAt(LocalDateTime.now(ZoneId.of("UTC")));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void removeMember(Long organizationId, Long userId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Organization organization = requireActiveOrganization(organizationId);
        validateOrgAdminAccess(requester, organization.getId());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(organizationId)) {
            throw new ResourceNotFoundException("User", userId);
        }
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("SUPER_ADMIN cannot be removed from an organization");
        }

        userRepository.delete(user);
    }

    private void validateOrgAccess(User requester, Long organizationId) {
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (requester.getOrganization() == null || !requester.getOrganization().getId().equals(organizationId)) {
            throw new UnauthorizedException("You are not authorized to access this organization");
        }
    }

    private void validateOrgAdminAccess(User requester, Long organizationId) {
        validateOrgAccess(requester, organizationId);
        if (requester.getRole() != Role.SUPER_ADMIN && requester.getRole() != Role.ORG_ADMIN) {
            throw new UnauthorizedException("Only organization admins can manage members");
        }
    }

    private Organization requireActiveOrganization(Long id) {
        Organization organization = organizationRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Organization", id));
        return requireActiveOrganization(organization);
    }

    private Organization requireActiveOrganization(Organization organization) {
        if (!Boolean.TRUE.equals(organization.getIsActive())) {
            throw new BadRequestException("Organization is inactive");
        }
        return organization;
    }

    private String generatePassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(CHARS.charAt(RANDOM.nextInt(CHARS.length())));
        return sb.toString();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private OrganizationResponse toResponse(Organization organization) {
        return OrganizationResponse.builder()
                .id(organization.getId())
                .name(organization.getName())
                .slug(organization.getSlug())
                .plan(organization.getPlan())
                .isActive(organization.getIsActive())
                .createdAt(organization.getCreatedAt())
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .orgId(user.getOrganization() != null ? user.getOrganization().getId() : null)
                .orgSlug(user.getOrganization() != null ? user.getOrganization().getSlug() : null)
                .rollNo(user.getRollNo())
                .semester(user.getSemester())
                .batch(user.getBatch())
                .course(user.getCourse())
                .stream(user.getStream())
                .appliedRole(user.getAppliedRole())
                .invitationStatus(user.getInvitationStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    private String generateActivationToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private String buildActivationLink(String email, String token) {
        return frontendUrl + "/activate-invitation?email="
                + URLEncoder.encode(email, StandardCharsets.UTF_8)
                + "&token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }
}
