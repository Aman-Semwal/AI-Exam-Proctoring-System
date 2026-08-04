package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AssignmentServiceImpl implements AssignmentService {

    private final ExamAssignmentRepository assignmentRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public AssignmentResponse assignStudent(AssignmentRequest request) {
        Exam exam = examRepository.findById(request.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", request.getExamId()));

        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));

        if (assignmentRepository.existsByExamIdAndStudentId(request.getExamId(), request.getStudentId())) {
            throw new BadRequestException("Student is already assigned to this exam");
        }

        ExamAssignment assignment = ExamAssignment.builder()
                .exam(exam)
                .student(student)
                .build();

        return toResponse(assignmentRepository.save(assignment));
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByExam(Long examId) {
        if (!examRepository.existsById(examId)) {
            throw new ResourceNotFoundException("Exam", examId);
        }
        return assignmentRepository.findByExamId(examId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AssignmentResponse> getAssignmentsByStudent(Long studentId) {
        if (!userRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("User", studentId);
        }
        return assignmentRepository.findByStudentId(studentId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void removeAssignment(Long assignmentId) {
        ExamAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", assignmentId));
        assignmentRepository.delete(assignment);
    }

    private AssignmentResponse toResponse(ExamAssignment a) {
        return AssignmentResponse.builder()
                .id(a.getId())
                .examId(a.getExam().getId())
                .examTitle(a.getExam().getTitle())
                .studentId(a.getStudent().getId())
                .studentName(a.getStudent().getName())
                .studentEmail(a.getStudent().getEmail())
                .assignedAt(a.getAssignedAt())
                .build();
    }
}
