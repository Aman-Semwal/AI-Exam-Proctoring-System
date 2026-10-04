package com.proctor.proctorbackend.bulkimport;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.List;
import java.util.Optional;

public interface BulkImportJobRepository extends JpaRepository<BulkImportJob, Long> {

    @EntityGraph(attributePaths = "errors")
    @NonNull Optional<BulkImportJob> findById(@NonNull Long id);

    @EntityGraph(attributePaths = "errors")
    List<BulkImportJob> findByOrganizationIdOrderByCreatedAtDesc(Long orgId);
}
