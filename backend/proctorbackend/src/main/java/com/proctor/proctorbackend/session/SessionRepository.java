package com.proctor.proctorbackend.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SessionRepository extends JpaRepository<ExamSession, Long> {

    List<ExamSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<ExamSession> findByExamIdOrderByCreatedAtDesc(Long examId);

    Optional<ExamSession> findByExamIdAndStudentId(Long examId, Long studentId);

    boolean existsByExamIdAndStudentIdAndStatus(Long examId, Long studentId, SessionStatus status);

    long countByExamIdAndStudentId(Long examId, Long studentId);
}
