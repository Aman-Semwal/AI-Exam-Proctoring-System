package com.proctor.proctorbackend.examproctor;

import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "exam_proctor_assignments",
        uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "examiner_id"}))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamProctorAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "examiner_id", nullable = false)
    private User examiner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    private Organization organization;

    @Column(nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now(java.time.ZoneId.of("UTC"));
    }
}
