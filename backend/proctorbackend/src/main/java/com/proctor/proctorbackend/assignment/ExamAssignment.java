package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * JPA entity representing an assignment of an exam to a specific student.
 *
 * <p>An {@link Exam} can be assigned to multiple students. Only assigned students
 * are permitted to start an {@link com.proctor.proctorbackend.session.ExamSession}
 * for that exam.
 */
@Entity
@Table(
    name = "exam_assignments",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_exam_student",
        columnNames = {"exam_id", "student_id"}
    )
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExamAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}
