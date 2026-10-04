package com.proctor.proctorbackend.violation;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** The webcam frame that triggered an AI violation (see V28). */
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
