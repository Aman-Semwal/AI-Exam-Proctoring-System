package com.proctor.proctorbackend.organization;

import com.proctor.proctorbackend.common.response.ApiResponse;
import com.proctor.proctorbackend.organization.dto.InviteMemberRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationResponse;
import com.proctor.proctorbackend.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
@Tag(name = "Organizations", description = "Organization and member management")
@SecurityRequirement(name = "bearerAuth")
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    @Operation(summary = "Create an organization")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationResponse>> createOrganization(
            @Valid @RequestBody OrganizationRequest request) {
        OrganizationResponse response = organizationService.createOrganization(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Organization created", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get organization by ID")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<OrganizationResponse>> getOrganization(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Organization fetched",
                organizationService.getOrganization(id, userDetails.getUsername())));
    }

    @GetMapping("/{id}/members")
    @Operation(summary = "List organization members")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> listMembers(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Members fetched",
                organizationService.listMembers(id, userDetails.getUsername())));
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Invite organization member")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> inviteMember(
            @PathVariable Long id,
            @Valid @RequestBody InviteMemberRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserDto response = organizationService.inviteMember(id, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Member invited", response));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove organization member")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long id,
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        organizationService.removeMember(id, userId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Member removed"));
    }
}
