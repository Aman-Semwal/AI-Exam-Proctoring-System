package com.proctor.proctorbackend.violation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ViolationEvidenceRepository extends JpaRepository<ViolationEvidence, Long> {

    Optional<ViolationEvidence> findFirstByViolationIdAndKind(Long violationId, EvidenceKind kind);

    /** Which of the given violations have a webcam image — one query for a whole list. */
    @Query("select distinct e.violation.id from ViolationEvidence e where e.violation.id in :ids"
            + " and e.kind = com.proctor.proctorbackend.violation.EvidenceKind.CAMERA")
    List<Long> findViolationIdsWithEvidence(Collection<Long> ids);

    /** Which of the given violations have a screenshot. */
    @Query("select distinct e.violation.id from ViolationEvidence e where e.violation.id in :ids"
            + " and e.kind = com.proctor.proctorbackend.violation.EvidenceKind.SCREEN")
    List<Long> findViolationIdsWithScreenEvidence(Collection<Long> ids);
}
