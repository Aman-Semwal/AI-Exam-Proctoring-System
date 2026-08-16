package com.proctor.proctorbackend.session;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamSessionRepository extends JpaRepository<ExamSession, Long> {

    List<ExamSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<ExamSession> findByStudentIdAndOrganizationIdOrderByCreatedAtDesc(Long studentId, Long organizationId);

    List<ExamSession> findByExamIdOrderByCreatedAtDesc(Long examId);

    List<ExamSession> findByExamIdAndOrganizationIdOrderByCreatedAtDesc(Long examId, Long organizationId);

    Optional<ExamSession> findByExamIdAndStudentId(Long examId, Long studentId);

    boolean existsByExamIdAndStudentIdAndStatus(Long examId, Long studentId, SessionStatus status);

    long countByExamIdAndStudentId(Long examId, Long studentId);

    List<ExamSession> findByStatus(SessionStatus status);
}
