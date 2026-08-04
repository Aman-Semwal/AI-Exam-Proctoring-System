package com.proctor.proctorbackend.proctoring;

import com.proctor.proctorbackend.session.ExamSession;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing a single face-detection event captured during an exam session.
 *
 * <p>Events are created by {@link com.proctor.proctorbackend.proctoring.ProctoringServiceImpl}
 * each time a student submits a webcam frame. Each event records the face count returned
 * by the AI service and the derived {@link EventType}.
 *
 * <p>Violation events ({@code NO_FACE_DETECTED}, {@code MULTIPLE_FACES_DETECTED}) also
 * trigger a real-time WebSocket alert to the examiner.
 */
@Entity
@Table(name = "proctoring_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProctoringEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ExamSession session;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(length = 500)
    private String details;

    private Integer faceCount;

    @Column(updatable = false)
    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
    }

    public enum EventType {
        NO_FACE_DETECTED,
        MULTIPLE_FACES_DETECTED,
        FACE_DETECTED
    }
}
