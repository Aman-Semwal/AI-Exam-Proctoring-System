package com.proctor.proctorbackend.user;

import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.user.dto.UpdateProfileRequest;
import com.proctor.proctorbackend.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Concrete implementation of {@link UserService} and Spring Security's
 * {@link UserDetailsService}.
 *
 * <h3>BUG-016 fix</h3>
 * <p>{@code toDto()} previously omitted {@code appliedRole}, causing
 * {@code GET /api/users/me} to always return {@code "appliedRole": null} even when the
 * field was populated (e.g. via bulk import). The field is now mapped correctly.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService, UserDetailsService {

    private final UserRepository userRepository;

    // -----------------------------------------------------------------------
    // UserDetailsService — used by Spring Security / JwtAuthFilter
    // -----------------------------------------------------------------------

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    // -----------------------------------------------------------------------
    // UserService
    // -----------------------------------------------------------------------

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        return toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", email));
        user.setName(request.getName());
        return toDto(userRepository.save(user));
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .orgId(user.getOrganization()   != null ? user.getOrganization().getId()   : null)
                .orgSlug(user.getOrganization() != null ? user.getOrganization().getSlug() : null)
                .rollNo(user.getRollNo())
                .semester(user.getSemester())
                .batch(user.getBatch())
                .course(user.getCourse())
                .stream(user.getStream())
                .appliedRole(user.getAppliedRole())        // BUG-016 fix: was missing
                .invitationStatus(user.getInvitationStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
