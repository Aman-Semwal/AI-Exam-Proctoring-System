package com.proctor.proctorbackend.question;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByExamId(Long examId);

    List<Question> findByExamIdAndTrackIn(Long examId, List<String> tracks);

    long countByExamId(Long examId);
}
