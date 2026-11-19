package com.proctor.proctorbackend.bulkimport;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BulkImportErrorRepository extends JpaRepository<BulkImportError, Long> {
}
