package com.proctor.proctorbackend.examproctor;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExamProctorAssignmentRepository extends JpaRepository<ExamProctorAssignment, Long> {
    boolean existsByExamIdAndExaminerId(Long examId, Long examinerId);
    List<ExamProctorAssignment> findByExamId(Long examId);
    List<ExamProctorAssignment> findByExaminerId(Long examinerId);
    List<ExamProctorAssignment> findByExamIdAndOrganizationId(Long examId, Long orgId);
    void deleteByExamIdAndExaminerId(Long examId, Long examinerId);
}
