package com.proctor.proctorbackend.violation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ViolationEvidenceRepository extends JpaRepository<ViolationEvidence, Long> {

    Optional<ViolationEvidence> findFirstByViolationId(Long violationId);

    /** Which of the given violations have evidence — one query for a whole list. */
    @Query("select distinct e.violation.id from ViolationEvidence e where e.violation.id in :ids")
    List<Long> findViolationIdsWithEvidence(Collection<Long> ids);
}
