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

    @org.springframework.data.jpa.repository.Query(
        "SELECT DISTINCT e FROM Exam e LEFT JOIN ExamExaminerAssignment ea ON ea.exam = e " +
        "WHERE e.organization.id = :orgId AND (e.createdBy.id = :userId OR ea.examiner.id = :userId) " +
        "ORDER BY e.startTime DESC"
    )
    @EntityGraph(attributePaths = {"createdBy", "organization"})
    List<Exam> findExamsForExaminer(@org.springframework.data.repository.query.Param("orgId") Long orgId, 
                                    @org.springframework.data.repository.query.Param("userId") Long userId);
}
