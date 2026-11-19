package com.proctor.proctorbackend.bulkimport.dto;

import com.proctor.proctorbackend.bulkimport.BulkImportStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkImportJobStatusResponse {
    private Long jobId;
    private BulkImportStatus status;
    private String fileName;
    private int totalRows;
    private int successCount;
    private int failedCount;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private List<RowError> errors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RowError {
        private int rowNumber;
        private String email;
        private String reason;
    }
}
