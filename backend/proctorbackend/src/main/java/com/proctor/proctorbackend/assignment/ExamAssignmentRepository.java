package com.proctor.proctorbackend.assignment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {

    List<ExamAssignment> findByExamId(Long examId);

    List<ExamAssignment> findByExamIdAndOrganizationId(Long examId, Long organizationId);

    List<ExamAssignment> findByStudentId(Long studentId);

    List<ExamAssignment> findByStudentIdAndOrganizationId(Long studentId, Long organizationId);

    Optional<ExamAssignment> findByExamIdAndStudentId(Long examId, Long studentId);

    boolean existsByExamIdAndStudentId(Long examId, Long studentId);
}
