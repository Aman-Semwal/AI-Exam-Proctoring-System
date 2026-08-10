package com.proctor.proctorbackend.bulkimport;

import com.proctor.proctorbackend.bulkimport.dto.BulkImportJobStatusResponse;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.organization.OrganizationRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import org.springframework.context.ApplicationEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BulkImportServiceImpl implements BulkImportService {

    private final BulkImportJobRepository jobRepository;
    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final BulkImportProcessor processor;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public Long submitJob(Long orgId, MultipartFile file, String uploaderEmail) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization", orgId));
        User uploader = userRepository.findByEmail(uploaderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        validateAdminAccess(uploader, orgId);

        BulkImportJob job = BulkImportJob.builder()
                .organization(org)
                .uploadedBy(uploader)
                .status(BulkImportStatus.PENDING)
                .fileName(file.getOriginalFilename())
                .totalRows(0).successCount(0).failedCount(0)
                .build();
        BulkImportJob saved = jobRepository.save(job);

        try {
            byte[] bytes = file.getBytes();
            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
            eventPublisher.publishEvent(new BulkImportJobSubmittedEvent(saved.getId(), bytes, filename, org.getId()));
        } catch (Exception e) {
            log.error("Failed to read upload file: {}", e.getMessage());
            saved.setStatus(BulkImportStatus.FAILED);
            jobRepository.save(saved);
        }
        return saved.getId();
    }

    @Override
    @Transactional(readOnly = true)
    public BulkImportJobStatusResponse getJobStatus(Long orgId, Long jobId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        validateAdminAccess(requester, orgId);
        BulkImportJob job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("BulkImportJob", jobId));
        if (!job.getOrganization().getId().equals(orgId)) {
            throw new UnauthorizedException("Job does not belong to this organization");
        }
        return toResponse(job);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BulkImportJobStatusResponse> listJobs(Long orgId, String requesterEmail) {
        User requester = userRepository.findByEmail(requesterEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        validateAdminAccess(requester, orgId);
        return jobRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId)
                .stream().map(this::toResponse).toList();
    }

    private void validateAdminAccess(User user, Long orgId) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getRole() != Role.ORG_ADMIN) {
            throw new UnauthorizedException("Only ORG_ADMIN can manage bulk imports");
        }
        if (user.getOrganization() == null || !user.getOrganization().getId().equals(orgId)) {
            throw new UnauthorizedException("You are not authorized to access this organization");
        }
    }

    private BulkImportJobStatusResponse toResponse(BulkImportJob job) {
        List<BulkImportJobStatusResponse.RowError> errs = job.getErrors().stream()
                .map(e -> BulkImportJobStatusResponse.RowError.builder()
                        .rowNumber(e.getRowNumber())
                        .email(e.getEmail())
                        .reason(e.getReason())
                        .build())
                .toList();
        return BulkImportJobStatusResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus())
                .fileName(job.getFileName())
                .totalRows(job.getTotalRows())
                .successCount(job.getSuccessCount())
                .failedCount(job.getFailedCount())
                .createdAt(job.getCreatedAt())
                .completedAt(job.getCompletedAt())
                .errors(errs)
                .build();
    }
}
