package com.proctor.proctorbackend.examproctor;

import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentRequest;
import com.proctor.proctorbackend.examproctor.dto.ProctorAssignmentResponse;

import java.util.List;

public interface ExamProctorService {
    ProctorAssignmentResponse assignProctor(Long examId, ProctorAssignmentRequest request, String requesterEmail);
    void removeProctor(Long examId, Long examinerId, String requesterEmail);
    List<ProctorAssignmentResponse> getProctorsByExam(Long examId, String requesterEmail);
    List<ProctorAssignmentResponse> getExamsByProctor(Long examinerId, String requesterEmail);
    boolean isProctorAssignedToExam(Long examinerId, Long examId);
}
