package com.proctor.proctorbackend.organization;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.organization.dto.InviteMemberRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .organization(organization)
                .build();

        return toUserDto(userRepository.save(user));
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
                .createdAt(user.getCreatedAt())
                .build();
    }
}
