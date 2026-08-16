package com.proctor.proctorbackend.bulkimport;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BulkImportJobRepository extends JpaRepository<BulkImportJob, Long> {

    @EntityGraph(attributePaths = "errors")
    Optional<BulkImportJob> findById(Long id);

    @EntityGraph(attributePaths = "errors")
    List<BulkImportJob> findByOrganizationIdOrderByCreatedAtDesc(Long orgId);
}
