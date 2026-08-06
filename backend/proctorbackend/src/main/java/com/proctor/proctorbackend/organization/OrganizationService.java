package com.proctor.proctorbackend.organization;

import com.proctor.proctorbackend.organization.dto.InviteMemberRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationResponse;
import com.proctor.proctorbackend.user.dto.UserDto;

import java.util.List;

public interface OrganizationService {

    OrganizationResponse createOrganization(OrganizationRequest request);

    OrganizationResponse getOrganization(Long id, String requesterEmail);

    List<UserDto> listMembers(Long organizationId, String requesterEmail);

    UserDto inviteMember(Long organizationId, InviteMemberRequest request, String requesterEmail);

    void removeMember(Long organizationId, Long userId, String requesterEmail);
}
