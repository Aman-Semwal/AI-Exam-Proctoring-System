package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final ExamAssignmentRepository assignmentRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AssignmentResponse assignStudent(AssignmentRequest request, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));
        validateSameOrganization(requester, exam);

        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));
        validateSameOrganization(student, exam);

        if (assignmentRepository.existsByExamIdAndStudentId(request.getExamId(), request.getStudentId())) {
            throw new BadRequestException("Student is already assigned to this exam");
        }

        ExamAssignment assignment = ExamAssignment.builder()
                .exam(exam)
                .student(student)
                .organization(exam.getOrganization())
                .track(student.getAppliedRole())
                .build();

        return toResponse(assignmentRepository.save(assignment));
    }

    @Override
    @Transactional
    public List<AssignmentResponse> assignAllStudents(Long examId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        validateSameOrganization(requester, exam);

        List<User> students = userRepository.findByOrganizationIdAndRole(
                exam.getOrganization().getId(), Role.STUDENT);

        List<ExamAssignment> toSave = students.stream()
                .filter(s -> !assignmentRepository.existsByExamIdAndStudentId(examId, s.getId()))
                .map(s -> ExamAssignment.builder()
                        .exam(exam)
                        .student(s)
                        .organization(exam.getOrganization())
                        .track(s.getAppliedRole())
                        .build())
                .collect(Collectors.toList());

        return assignmentRepository.saveAll(toSave).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByExam(Long examId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        validateSameOrganization(requester, exam);

        if (requester.getRole() == Role.SUPER_ADMIN) {
            return assignmentRepository.findByExamId(examId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return assignmentRepository.findByExamIdAndOrganizationId(examId, requester.getOrganization().getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByStudent(Long studentId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        if (requester.getRole() == Role.STUDENT && !requester.getId().equals(studentId)) {
            throw new UnauthorizedException("You are not authorized to access this user's assignments");
        }
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("User", studentId));
        validateSameOrganization(requester, student);

        if (requester.getRole() == Role.SUPER_ADMIN) {
            return assignmentRepository.findByStudentId(studentId).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return assignmentRepository.findByStudentIdAndOrganizationId(studentId, requester.getOrganization().getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void removeAssignment(Long assignmentId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        ExamAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        validateSameOrganization(requester, assignment.getExam());
        assignmentRepository.delete(assignment);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void validateSameOrganization(User user, Exam exam) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (user.getOrganization() == null || exam.getOrganization() == null
                || !user.getOrganization().getId().equals(exam.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this exam");
        }
    }

    private void validateSameOrganization(User requester, User target) {
        if (requester.getRole() == Role.SUPER_ADMIN) {
            return;
        }
        if (requester.getOrganization() == null || target.getOrganization() == null
                || !requester.getOrganization().getId().equals(target.getOrganization().getId())) {
            throw new UnauthorizedException("You are not authorized to access this user");
        }
    }

    private AssignmentResponse toResponse(ExamAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .examId(a.getExam().getId())
                .examTitle(a.getExam().getTitle())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getName())
                .studentEmail(a.getStudent().getEmail())
                .orgId(a.getOrganization() != null ? a.getOrganization().getId() : null)
                .orgSlug(a.getOrganization() != null ? a.getOrganization().getSlug() : null)
                .track(a.getTrack())
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
