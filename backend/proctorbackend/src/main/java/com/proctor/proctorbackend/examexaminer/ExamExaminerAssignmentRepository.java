package com.proctor.proctorbackend.examexaminer;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExamExaminerAssignmentRepository extends JpaRepository<ExamExaminerAssignment, Long> {
    boolean existsByExamIdAndExaminerId(Long examId, Long examinerId);
    List<ExamExaminerAssignment> findByExamId(Long examId);
    void deleteByExamIdAndExaminerId(Long examId, Long examinerId);
}
