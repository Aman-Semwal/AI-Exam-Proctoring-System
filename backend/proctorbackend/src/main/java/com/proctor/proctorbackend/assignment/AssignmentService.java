package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;

import java.util.List;

public interface AssignmentService {

    AssignmentResponse assignStudent(AssignmentRequest request, String requesterEmail);

    List<AssignmentResponse> assignAllStudents(Long examId, String requesterEmail);

    List<AssignmentResponse> getAssignmentsByExam(Long examId, String requesterEmail);

    List<AssignmentResponse> getAssignmentsByStudent(Long studentId, String requesterEmail);

    void removeAssignment(Long assignmentId, String requesterEmail);
}
