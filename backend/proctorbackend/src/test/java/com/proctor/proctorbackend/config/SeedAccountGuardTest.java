package com.proctor.proctorbackend.config;

import com.proctor.proctorbackend.user.InvitationStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SeedAccountGuardTest {

    @Mock UserRepository userRepository;

    @Test
    void disabledFlag_deactivatesEverySeededDemoAccount() {
        User demo = User.builder().email("student@tech.edu").invitationStatus(InvitationStatus.ACTIVE).build();
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.findByEmail("student@tech.edu")).thenReturn(Optional.of(demo));

        new SeedAccountGuard(userRepository, false).run(null);

        assertEquals(InvitationStatus.EXPIRED, demo.getInvitationStatus());
        assertFalse(demo.isEnabled());
        verify(userRepository).save(demo);
    }

    @Test
    void disabledFlag_neverTouchesTheSuperAdmin() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        new SeedAccountGuard(userRepository, false).run(null);

        verify(userRepository, never()).findByEmail("superadmin@proctor.com");
    }

    @Test
    void enabledFlag_leavesAccountsAlone() {
        new SeedAccountGuard(userRepository, true).run(null);

        verifyNoInteractions(userRepository);
    }
}
