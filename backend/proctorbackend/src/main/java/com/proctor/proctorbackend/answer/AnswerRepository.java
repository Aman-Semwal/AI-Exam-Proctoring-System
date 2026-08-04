package com.proctor.proctorbackend.answer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findBySessionId(Long sessionId);

    Optional<Answer> findBySessionIdAndQuestionId(Long sessionId, Long questionId);

    boolean existsBySessionIdAndQuestionId(Long sessionId, Long questionId);

    long countBySessionIdAndIsCorrect(Long sessionId, boolean isCorrect);
}
