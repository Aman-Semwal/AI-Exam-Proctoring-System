package com.proctor.proctorbackend.exam;

import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.organization.Organization;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing an exam created by an examiner.
 *
 * <p>An exam has a title, optional description, duration, and a scheduled window
 * defined by {@code startTime} and {@code endTime}. It is linked to its creator
 * ({@code createdBy}) via a lazy {@code @ManyToOne} relationship.
 *
 * <p>Timestamps ({@code createdAt}, {@code updatedAt}) are managed by
 * {@link jakarta.persistence.PrePersist} and {@link jakarta.persistence.PreUpdate}
 * lifecycle callbacks.
 */
@Entity
@Table(name = "exams")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Integer durationMinutes;

    /** Exam window opens at this time — students may start their session. */
    @Column(nullable = false)
    private LocalDateTime startTime;

    /** Exam window closes at this time — sessions are auto-terminated after this. */
    @Column(nullable = false)
    private LocalDateTime endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(java.time.ZoneId.of("UTC"));
        updatedAt = LocalDateTime.now(java.time.ZoneId.of("UTC"));
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now(java.time.ZoneId.of("UTC"));
    }
}
