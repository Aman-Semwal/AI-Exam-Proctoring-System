package com.proctor.proctorbackend.organization;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing a tenant organization in the multi-tenant SaaS platform.
 *
 * <p>Every user (except SUPER_ADMIN), exam, session, and violation belongs to exactly
 * one organization. The {@code slug} is a URL-safe unique identifier used in audit logs,
 * JWT claims, and API paths.
 *
 * <p>The {@code plan} column drives feature limits (max students, AI model tier, etc.)
 * and is linked to a {@code Subscription} record managed in Phase 6.
 */
@Entity
@Table(name = "organizations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-readable organization name (e.g. "MIT EECS Department"). */
    @Column(nullable = false)
    private String name;

    /**
     * URL-safe unique slug used in JWT claims, audit entries, and sub-domain routing
     * (e.g. {@code "mit-eecs"}).
     */
    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    /**
     * Subscription plan tier: {@code FREE}, {@code PRO}, or {@code ENTERPRISE}.
     * Defaults to {@code FREE} on creation.
     */
    @Column(nullable = false, length = 50)
    @Builder.Default
    private String plan = "FREE";

    /** Whether this organization's account is active. Soft-disable without deleting. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

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
}
