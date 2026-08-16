package com.proctor.proctorbackend.examproctor;

import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentRequest;
import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ExamProctorServiceImpl implements ExamProctorService {

    private final ExamProctorAssignmentRepository proctorRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProctorAssignmentResponse assignProctor(Long examId, ProctorAssignmentRequest request, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Exam exam = getExam(examId);
        validateAdminAccess(requester, exam);

        User examiner = userRepository.findById(request.getExaminerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getExaminerId()));

        if (examiner.getRole() != Role.PROCTOR && examiner.getRole() != Role.EXAM_CREATOR) {
            throw new BadRequestException("User must have PROCTOR or EXAM_CREATOR role");
        }
        validateSameOrg(examiner, exam);

        if (proctorRepository.existsByExamIdAndExaminerId(examId, examiner.getId())) {
            throw new BadRequestException("Examiner is already assigned to this exam");
        }

        ExamProctorAssignment assignment = ExamProctorAssignment.builder()
                .exam(exam)
                .examiner(examiner)
                .organization(exam.getOrganization())
                .build();

        return toResponse(proctorRepository.save(assignment));
    }

    @Override
    @Transactional
    public void removeProctor(Long examId, Long examinerId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Exam exam = getExam(examId);
        validateAdminAccess(requester, exam);
        proctorRepository.deleteByExamIdAndExaminerId(examId, examinerId);
    }

    @Override
    public List<ProctorAssignmentResponse> getProctorsByExam(Long examId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        Exam exam = getExam(examId);
        validateAdminAccess(requester, exam);
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return proctorRepository.findByExamId(examId).stream().map(this::toResponse).toList();
        }
        return proctorRepository.findByExamIdAndOrganizationId(examId, requester.getOrganization().getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public List<ProctorAssignmentResponse> getExamsByProctor(Long examinerId, String requesterEmail) {
        User requester = getUser(requesterEmail);
        if (requester.getRole() == Role.PROCTOR && !requester.getId().equals(examinerId)) {
            throw new UnauthorizedException("You can only view your own assignments");
        }
        return proctorRepository.findByExaminerId(examinerId).stream().map(this::toResponse).toList();
    }

    @Override
    public boolean isProctorAssignedToExam(Long examinerId, Long examId) {
        return proctorRepository.existsByExamIdAndExaminerId(examId, examinerId);
    }

    private void validateAdminAccess(User requester, Exam exam) {
        if (requester.getRole() == Role.SUPER_ADMIN) return;
        if (requester.getRole() != Role.ORG_ADMIN) {
            throw new UnauthorizedException("Only ORG_ADMIN can manage proctor assignments");
        }
        validateSameOrg(requester, exam);
    }

    private void validateSameOrg(User user, Exam exam) {
        if (user.getRole() == Role.SUPER_ADMIN) return;
        if (user.getOrganization() == null || exam.getOrganization() == null
                || !user.getOrganization().getId().equals(exam.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this exam");
        }
    }

    private Exam getExam(Long id) {
        return examRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Exam", id));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ProctorAssignmentResponse toResponse(ExamProctorAssignment a) {
        return ProctorAssignmentResponse.builder()
                .id(a.getId())
                .examId(a.getExam().getId())
                .examTitle(a.getExam().getTitle())
                .examinerId(a.getExaminer().getId())
                .examinerName(a.getExaminer().getName())
                .examinerEmail(a.getExaminer().getEmail())
                .orgId(a.getOrganization() != null ? a.getOrganization().getId() : null)
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
