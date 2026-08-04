package com.proctor.proctorbackend.exam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    List<Exam> findByCreatedByIdOrderByStartTimeDesc(Long createdById);
}
