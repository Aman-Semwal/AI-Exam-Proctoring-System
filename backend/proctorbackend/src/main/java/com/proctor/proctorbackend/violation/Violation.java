package com.proctor.proctorbackend.violation;

import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.session.ExamSession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing a proctoring violation recorded during an exam session.
 *
 * <p>Violations are created automatically by the AI proctoring pipeline (e.g. no face
 * detected, multiple faces) or manually by an examiner reviewing suspicious activity.
 * The {@code reviewed} flag lets examiners mark violations as reviewed.
 */
@Entity
@Table(name = "violations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViolationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ViolationSeverity severity;

    @Column(length = 1000)
    private String details;

    @Column(nullable = false)
    private Boolean reviewed;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (reviewed == null) {
            reviewed = false;
        }
    }
}
