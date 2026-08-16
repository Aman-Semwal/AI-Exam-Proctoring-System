package com.proctor.proctorbackend.bulkimport;

public record BulkImportJobSubmittedEvent(
        Long jobId,
        byte[] fileBytes,
        String filename,
        Long organizationId) {
}
