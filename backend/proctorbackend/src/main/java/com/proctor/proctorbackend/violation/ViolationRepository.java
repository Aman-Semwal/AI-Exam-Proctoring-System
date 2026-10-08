package com.proctor.proctorbackend.violation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {

    List<Violation> findBySessionId(Long sessionId);

    List<Violation> findBySessionIdAndOrganizationId(Long sessionId, Long organizationId);

    List<Violation> findBySessionIdAndReviewed(Long sessionId, boolean reviewed);

    List<Violation> findBySessionIdAndOrganizationIdAndReviewed(Long sessionId, Long organizationId, boolean reviewed);

    long countBySessionId(Long sessionId);

    long countBySessionIdAndType(Long sessionId, ViolationType type);

    /** Violations of a type that a reviewer has not dismissed as false positives. */
    @Query("select count(v) from Violation v where v.session.id = :sessionId and v.type = :type "
            + "and (v.reviewOutcome is null or v.reviewOutcome <> com.proctor.proctorbackend.violation.ReviewOutcome.DISMISSED)")
    long countNotDismissedBySessionIdAndType(@Param("sessionId") Long sessionId, @Param("type") ViolationType type);

    long countBySessionIdAndSeverity(Long sessionId, com.proctor.proctorbackend.violation.ViolationSeverity severity);
}
