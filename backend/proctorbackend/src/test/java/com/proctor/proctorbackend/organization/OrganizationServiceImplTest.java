package com.proctor.proctorbackend.organization;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.mail.MailService;
import com.proctor.proctorbackend.organization.dto.InvitationActivationRequest;
import com.proctor.proctorbackend.organization.dto.InviteMemberRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationRequest;
import com.proctor.proctorbackend.organization.dto.OrganizationResponse;
import com.proctor.proctorbackend.user.InvitationStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceImplTest {

    @Mock OrganizationRepository organizationRepository;
    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock MailService mailService;
    @InjectMocks OrganizationServiceImpl service;

    Organization org;
    User orgAdmin;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "frontendUrl", "http://localhost:5173");
        org = Organization.builder().id(1L).name("Infosys").slug("infosys").isActive(true).build();
        orgAdmin = User.builder().id(1L).email("admin@infosys.com")
                .role(Role.ORG_ADMIN).organization(org).build();
    }

    @Test
    void createOrganization_throwsWhenSlugAlreadyExists() {
        OrganizationRequest req = new OrganizationRequest();
        req.setName("Infosys");
        req.setSlug("infosys");

        when(organizationRepository.existsBySlug("infosys")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.createOrganization(req));
        verify(organizationRepository, never()).save(any());
    }

    @Test
    void createOrganization_defaultsPlanToFree() {
        OrganizationRequest req = new OrganizationRequest();
        req.setName("Infosys");
        req.setSlug("infosys");
        req.setPlan(null);

        when(organizationRepository.existsBySlug("infosys")).thenReturn(false);
        when(organizationRepository.save(any())).thenAnswer(inv -> {
            Organization o = inv.getArgument(0);
            o = Organization.builder().id(1L).name(o.getName()).slug(o.getSlug())
                    .plan(o.getPlan()).isActive(o.getIsActive()).build();
            return o;
        });

        OrganizationResponse resp = service.createOrganization(req);

        assertEquals("FREE", resp.getPlan());
    }

    @Test
    void inviteMember_throwsWhenSuperAdminRoleRequested() {
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("x@x.com");
        req.setName("X");
        req.setRole(Role.SUPER_ADMIN);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(orgAdmin));
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));

        assertThrows(BadRequestException.class, () -> service.inviteMember(1L, req, "admin@infosys.com"));
    }

    @Test
    void inviteMember_throwsWhenRequesterNotOrgAdmin() {
        User student = User.builder().id(2L).email("s@infosys.com")
                .role(Role.STUDENT).organization(org).build();
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("x@x.com");
        req.setName("X");
        req.setRole(Role.STUDENT);

        when(userRepository.findByEmail("s@infosys.com")).thenReturn(Optional.of(student));
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));

        assertThrows(UnauthorizedException.class, () -> service.inviteMember(1L, req, "s@infosys.com"));
    }

    @Test
    void inviteMember_sendsInvitationEmail() {
        InviteMemberRequest req = new InviteMemberRequest();
        req.setEmail("rahul@gmail.com");
        req.setName("Rahul");
        req.setRole(Role.STUDENT);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(orgAdmin));
        when(organizationRepository.findById(1L)).thenReturn(Optional.of(org));
        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            return User.builder().id(10L).name(u.getName()).email(u.getEmail())
                    .role(u.getRole()).organization(u.getOrganization())
                    .invitationStatus(InvitationStatus.PENDING)
                    .invitationTokenHash("hashed").password("hashed").build();
        });

        service.inviteMember(1L, req, "admin@infosys.com");

        verify(mailService).sendInvitationLink(eq("rahul@gmail.com"), eq("Rahul"),
                contains("activate-invitation"), eq("Infosys"), eq("STUDENT"));
    }

    @Test
    void activateInvitation_throwsWhenTokenExpired() {
        User pending = User.builder().id(5L).email("rahul@gmail.com")
                .role(Role.STUDENT).organization(org)
                .invitationStatus(InvitationStatus.PENDING)
                .invitationTokenHash("hashed")
                .invitationTokenExpiresAt(LocalDateTime.now().minusHours(1))
                .build();

        InvitationActivationRequest req = new InvitationActivationRequest();
        req.setEmail("rahul@gmail.com");
        req.setToken("sometoken");
        req.setPassword("newpass");

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(pending));

        assertThrows(BadRequestException.class, () -> service.activateInvitation(req));
    }

    @Test
    void activateInvitation_throwsWhenTokenInvalid() {
        User pending = User.builder().id(5L).email("rahul@gmail.com")
                .role(Role.STUDENT).organization(org)
                .invitationStatus(InvitationStatus.PENDING)
                .invitationTokenHash("hashed")
                .invitationTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        InvitationActivationRequest req = new InvitationActivationRequest();
        req.setEmail("rahul@gmail.com");
        req.setToken("wrongtoken");
        req.setPassword("newpass");

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("wrongtoken", "hashed")).thenReturn(false);

        assertThrows(BadRequestException.class, () -> service.activateInvitation(req));
    }

    @Test
    void activateInvitation_activatesUserOnValidToken() {
        User pending = User.builder().id(5L).email("rahul@gmail.com")
                .role(Role.STUDENT).organization(org)
                .invitationStatus(InvitationStatus.PENDING)
                .invitationTokenHash("hashed")
                .invitationTokenExpiresAt(LocalDateTime.now().plusHours(1))
                .build();

        InvitationActivationRequest req = new InvitationActivationRequest();
        req.setEmail("rahul@gmail.com");
        req.setToken("validtoken");
        req.setPassword("newpass123");

        when(userRepository.findByEmail("rahul@gmail.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("validtoken", "hashed")).thenReturn(true);
        when(passwordEncoder.encode("newpass123")).thenReturn("newhashedpass");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.activateInvitation(req);

        assertEquals(InvitationStatus.ACTIVE, pending.getInvitationStatus());
        assertNull(pending.getInvitationTokenHash());
        assertNotNull(pending.getInvitationAcceptedAt());
    }
}
