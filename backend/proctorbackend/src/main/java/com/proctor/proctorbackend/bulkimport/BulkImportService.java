package com.proctor.proctorbackend.bulkimport;

import com.proctor.proctorbackend.bulkimport.dto.BulkImportJobStatusResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface BulkImportService {
    Long submitJob(Long orgId, MultipartFile file, String uploaderEmail);
    BulkImportJobStatusResponse getJobStatus(Long orgId, Long jobId, String requesterEmail);
    List<BulkImportJobStatusResponse> listJobs(Long orgId, String requesterEmail);
}
