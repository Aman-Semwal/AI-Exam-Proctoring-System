package com.proctor.proctorbackend.bulkimport;

import com.proctor.proctorbackend.bulkimport.dto.BulkImportJobStatusResponse;
import com.proctor.proctorbackend.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orgs/{orgId}/bulk-import")
@RequiredArgsConstructor
@Tag(name = "Bulk Import", description = "Import students/examiners from CSV or XLSX")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ORG_ADMIN','SUPER_ADMIN')")
public class BulkImportController {

    private final BulkImportService bulkImportService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CSV/XLSX file to bulk-import users; returns jobId immediately")
    public ResponseEntity<ApiResponse<Map<String, Long>>> submit(
            @PathVariable Long orgId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long jobId = bulkImportService.submitJob(orgId, file, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success("Import job queued", Map.of("jobId", jobId)));
    }

    @GetMapping("/{jobId}")
    @Operation(summary = "Get bulk import job status and per-row error report")
    public ResponseEntity<ApiResponse<BulkImportJobStatusResponse>> status(
            @PathVariable Long orgId,
            @PathVariable Long jobId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Job status fetched",
                bulkImportService.getJobStatus(orgId, jobId, userDetails.getUsername())));
    }

    @GetMapping
    @Operation(summary = "List all bulk import jobs for an organization")
    public ResponseEntity<ApiResponse<List<BulkImportJobStatusResponse>>> list(
            @PathVariable Long orgId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success("Jobs fetched",
                bulkImportService.listJobs(orgId, userDetails.getUsername())));
    }
}
