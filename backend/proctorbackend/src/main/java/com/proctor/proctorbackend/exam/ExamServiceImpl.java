package com.proctor.proctorbackend.exam;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.exam.dto.ExamRequest;
import com.proctor.proctorbackend.exam.dto.ExamResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamServiceImpl implements ExamService {

    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ExamResponse createExam(ExamRequest request, String creatorEmail) {
        User creator = getUserByEmail(creatorEmail);
        validateExamWindow(request);

        Exam exam = Exam.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .durationMinutes(request.getDurationMinutes())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .createdBy(creator)
                .organization(requireOrganization(creator))
                .build();
        return toResponse(examRepository.save(exam));
    }

    @Override
    public ExamResponse getExamById(Long id, String requesterEmail) {
        Exam exam = findExamById(id);
        validateSameOrganization(getUserByEmail(requesterEmail), exam);
        return toResponse(exam);
    }

    @Override
    public List<ExamResponse> getAllExams(String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        if (requester.getRole() != Role.SUPER_ADMIN) {
            return examRepository.findByOrganizationIdOrderByStartTimeDesc(requireOrganization(requester).getId()).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return examRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<ExamResponse> getMyExams(String creatorEmail) {
        User creator = getUserByEmail(creatorEmail);
        if (creator.getRole() == Role.SUPER_ADMIN) {
            return examRepository.findByCreatedByIdOrderByStartTimeDesc(creator.getId())
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return examRepository.findByCreatedByIdAndOrganizationIdOrderByStartTimeDesc(
                        creator.getId(), requireOrganization(creator).getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExamResponse updateExam(Long id, ExamRequest request, String creatorEmail) {
        Exam exam = findExamById(id);
        validateOwnership(exam, creatorEmail);
        validateSameOrganization(getUserByEmail(creatorEmail), exam);
        validateExamWindow(request);

        exam.setTitle(request.getTitle());
        exam.setDescription(request.getDescription());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());

        return toResponse(examRepository.save(exam));
    }

    @Override
    @Transactional
    public void deleteExam(Long id, String creatorEmail) {
        Exam exam = findExamById(id);
        validateOwnership(exam, creatorEmail);
        validateSameOrganization(getUserByEmail(creatorEmail), exam);
        examRepository.delete(exam);
    }

    private void validateExamWindow(ExamRequest request) {
        if (request.getEndTime() != null && request.getStartTime() != null
                && !request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }
    }

    private Exam findExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateOwnership(Exam exam, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        if (requester.getRole() == Role.SUPER_ADMIN || requester.getRole() == Role.ORG_ADMIN) {
            return;
        }
        if (!exam.getCreatedBy().getEmail().equals(requesterEmail)) {
            throw new UnauthorizedException("You are not authorized to modify this exam");
        }
    }

    private com.proctor.proctorbackend.organization.Organization requireOrganization(User user) {
        if (user.getOrganization() == null) {
            throw new BadRequestException("User must belong to an organization for this operation");
        }
        return user.getOrganization();
    }

    private void validateSameOrganization(User requester, Exam exam) {
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (exam.getOrganization() == null || requester.getOrganization() == null
                || !exam.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this exam");
        }
    }

    private ExamResponse toResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .durationMinutes(exam.getDurationMinutes())
                .startTime(exam.getStartTime())
                .endTime(exam.getEndTime())
                .createdByName(exam.getCreatedBy().getName())
                .orgId(exam.getOrganization() != null ? exam.getOrganization().getId() : null)
                .orgSlug(exam.getOrganization() != null ? exam.getOrganization().getSlug() : null)
                .createdAt(exam.getCreatedAt())
                .build();
    }
}
