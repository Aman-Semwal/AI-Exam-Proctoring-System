package com.proctor.proctorbackend.proctoring;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProctoringEventRepository extends JpaRepository<ProctoringEvent, Long> {

    List<ProctoringEvent> findBySessionIdOrderByDetectedAtDesc(Long sessionId);

    List<ProctoringEvent> findBySessionIdAndEventTypeOrderByDetectedAtDesc(
            Long sessionId, ProctoringEvent.EventType eventType);

    long countBySessionIdAndEventType(Long sessionId, ProctoringEvent.EventType eventType);
}
