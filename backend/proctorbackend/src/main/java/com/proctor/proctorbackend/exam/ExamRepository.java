package com.proctor.proctorbackend.exam;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    @EntityGraph(attributePaths = {"createdBy", "organization"})
    List<Exam> findByCreatedByIdOrderByStartTimeDesc(Long createdById);

    @EntityGraph(attributePaths = {"createdBy", "organization"})
    List<Exam> findByOrganizationIdOrderByStartTimeDesc(Long organizationId);

    @EntityGraph(attributePaths = {"createdBy", "organization"})
    List<Exam> findByCreatedByIdAndOrganizationIdOrderByStartTimeDesc(Long createdById, Long organizationId);
}
