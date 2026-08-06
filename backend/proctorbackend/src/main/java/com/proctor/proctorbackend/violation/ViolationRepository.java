package com.proctor.proctorbackend.violation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ViolationRepository extends JpaRepository<Violation, Long> {

    List<Violation> findBySessionId(Long sessionId);

    List<Violation> findBySessionIdAndOrganizationId(Long sessionId, Long organizationId);

    List<Violation> findBySessionIdAndReviewed(Long sessionId, boolean reviewed);

    List<Violation> findBySessionIdAndOrganizationIdAndReviewed(Long sessionId, Long organizationId, boolean reviewed);

    long countBySessionId(Long sessionId);
}
