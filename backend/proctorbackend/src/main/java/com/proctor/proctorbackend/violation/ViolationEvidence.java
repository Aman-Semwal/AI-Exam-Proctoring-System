package com.proctor.proctorbackend.violation;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** An image behind a violation: the webcam frame, or a screenshot (see V28, V32). */
@Entity
@Table(name = "violation_evidence")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ViolationEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "violation_id", nullable = false)
    private Violation violation;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private EvidenceKind kind = EvidenceKind.CAMERA;

    @Column(name = "content_type", nullable = false, length = 50)
    private String contentType;

    @Column(nullable = false)
    private byte[] data;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now(java.time.ZoneOffset.UTC);
    }
}
