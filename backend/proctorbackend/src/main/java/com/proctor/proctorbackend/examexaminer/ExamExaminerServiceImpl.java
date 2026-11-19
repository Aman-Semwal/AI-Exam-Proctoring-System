package com.proctor.proctorbackend.examexaminer;

import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.ResourceNotFoundException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentRequest;
import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentResponse;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExamExaminerServiceImpl implements ExamExaminerService {

    private final ExamExaminerAssignmentRepository examinerRepository;
    private final ExamRepository examRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ExaminerAssignmentResponse assignExaminer(Long examId, ExaminerAssignmentRequest request, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Exam exam = getExamAndValidateOrganization(examId, requester);
        
        User examiner = userRepository.findById(request.getExaminerId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getExaminerId()));
        
        if (!examiner.getOrganization().getId().equals(exam.getOrganization().getId())) {
            throw new UnauthorizedException("Examiner must belong to the same organization");
        }

        if (examinerRepository.existsByExamIdAndExaminerId(examId, examiner.getId())) {
            throw new BadRequestException("Examiner is already assigned to this exam");
        }

        ExamExaminerAssignment assignment = ExamExaminerAssignment.builder()
                .exam(exam)
                .examiner(examiner)
                .organization(exam.getOrganization())
                .build();

        return toResponse(examinerRepository.save(assignment));
    }

    @Override
    @Transactional
    public void removeExaminer(Long examId, Long examinerId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        getExamAndValidateOrganization(examId, requester);
        examinerRepository.deleteByExamIdAndExaminerId(examId, examinerId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExaminerAssignmentResponse> getExaminersByExam(Long examId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        getExamAndValidateOrganization(examId, requester);
        
        return examinerRepository.findByExamId(examId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private Exam getExamAndValidateOrganization(Long examId, User requester) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        
        if (!exam.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new UnauthorizedException("You do not have access to this exam");
        }
        return exam;
    }

    private ExaminerAssignmentResponse toResponse(ExamExaminerAssignment assignment) {
        return ExaminerAssignmentResponse.builder()
                .id(assignment.getId())
                .examId(assignment.getExam().getId())
                .examinerId(assignment.getExaminer().getId())
                .examinerName(assignment.getExaminer().getName())
                .examinerEmail(assignment.getExaminer().getEmail())
                .assignedAt(assignment.getCreatedAt())
                .build();
    }
}
