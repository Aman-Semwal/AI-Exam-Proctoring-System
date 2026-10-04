package com.proctor.proctorbackend.examexaminer;

import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentRequest;
import com.proctor.proctorbackend.examexaminer.dto.ExaminerAssignmentResponse;
import java.util.List;

public interface ExamExaminerService {
    ExaminerAssignmentResponse assignExaminer(Long examId, ExaminerAssignmentRequest request, String requesterEmail);
    void removeExaminer(Long examId, Long examinerId, String requesterEmail);
    List<ExaminerAssignmentResponse> getExaminersByExam(Long examId, String requesterEmail);
}
