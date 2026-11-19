package com.proctor.proctorbackend.user.dto;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.user.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private Long orgId;
    private String orgSlug;
    private String rollNo;
    private String semester;
    private String batch;
    private String course;
    private String stream;
    private String appliedRole;
    private InvitationStatus invitationStatus;
    private LocalDateTime createdAt;
}
