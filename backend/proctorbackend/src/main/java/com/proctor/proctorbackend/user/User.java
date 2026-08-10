package com.proctor.proctorbackend.user;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.organization.Organization;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * JPA entity representing a system user (student, examiner, admin, etc.).
 *
 * <p>Implements {@link UserDetails} so Spring Security can load this entity
 * directly from the database and use it as the authenticated principal throughout
 * the request lifecycle.
 *
 * <p>The {@code email} field acts as the Spring Security username
 * (see {@link #getUsername()}).
 *
 * <p>Every user except {@code SUPER_ADMIN} belongs to an {@link Organization}.
 * SUPER_ADMIN users have {@code organization = null} — this is the platform-level
 * signal for cross-tenant access.
 *
 * <p>Timestamps ({@code createdAt}, {@code updatedAt}) are managed by
 * {@link PrePersist} and {@link PreUpdate} lifecycle callbacks.
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "invitation_status", nullable = false)
    @Builder.Default
    private InvitationStatus invitationStatus = InvitationStatus.ACTIVE;

    @Column(name = "invitation_token_hash")
    private String invitationTokenHash;

    @Column(name = "invitation_token_expires_at")
    private LocalDateTime invitationTokenExpiresAt;

    @Column(name = "invitation_accepted_at")
    private LocalDateTime invitationAcceptedAt;

    /**
     * The organization this user belongs to.
     * {@code null} only for {@code SUPER_ADMIN} — enforced at application level.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    // Optional student profile fields (populated via bulk import)
    private String rollNo;
    private String semester;
    private String batch;
    private String course;
    private String stream;

    /** Job role the student applied for — e.g. "SDE1", "SDE2", "DevOps". Used for exam track filtering. */
    @Column(name = "applied_role")
    private String appliedRole;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // --- UserDetails implementation ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
