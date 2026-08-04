package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;

import java.util.List;

public interface AssignmentService {

    AssignmentResponse assignStudent(AssignmentRequest request);

    List<AssignmentResponse> getAssignmentsByExam(Long examId);

    List<AssignmentResponse> getAssignmentsByStudent(Long studentId);

    void removeAssignment(Long assignmentId);
}
