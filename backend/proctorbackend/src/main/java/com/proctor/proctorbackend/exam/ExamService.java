package com.proctor.proctorbackend.exam;

import com.proctor.proctorbackend.exam.dto.ExamRequest;
import com.proctor.proctorbackend.exam.dto.ExamResponse;

import java.util.List;

public interface ExamService {

    ExamResponse createExam(ExamRequest request, String creatorEmail);

    ExamResponse getExamById(Long id, String requesterEmail);

    List<ExamResponse> getAllExams(String requesterEmail);

    List<ExamResponse> getMyExams(String creatorEmail);

    ExamResponse updateExam(Long id, ExamRequest request, String creatorEmail);

    void deleteExam(Long id, String creatorEmail);
}
