package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.question.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Single source of truth for computing a student's exam score.
 *
 * <p>Replaces three near-identical private helpers that previously existed in
 * {@code SessionServiceImpl}, {@code SessionExpiryProcessor}, and
 * {@code ProctoringServiceImpl}. The old copy in {@code ProctoringServiceImpl}
 * was also <em>broken</em> — it used {@code findByExamId} (all questions) instead of
 * {@code findByExamIdAndTrackIn}, awarding marks for questions the student was
 * never meant to answer.
 *
 * <h3>Track-filtering logic</h3>
 * <ol>
 *   <li>Look up the student's {@code ExamAssignment} for this session.</li>
 *   <li>If the assignment has a {@code track} value (e.g. "SDE1"), count questions
 *       whose track is either that value OR "COMMON".</li>
 *   <li>If no assignment / no track, fall back to "COMMON" only.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
public class ScoreCalculationService {

    private final QuestionRepository      questionRepository;
    private final AnswerRepository        answerRepository;
    private final ExamAssignmentRepository assignmentRepository;

    /**
     * Calculates the total score for a session by summing marks of all correctly
     * answered questions that belong to the student's assigned track (or COMMON).
     *
     * @param session the exam session to score (must have exam and student loaded)
     * @return the total score (0 if no correct answers or session has no exam)
     */
    public int calculate(ExamSession session) {
        if (session.getExam() == null || session.getExam().getId() == null) {
            return 0;
        }

        List<String> tracks = resolveTracks(session);

        return questionRepository
                .findByExamIdAndTrackIn(session.getExam().getId(), tracks)
                .stream()
                .filter(q -> isCorrectlyAnswered(session.getId(), q.getId()))
                .mapToInt(q -> q.getMarks())
                .sum();
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Resolves the set of question tracks visible to the student in this session.
     * Returns [studentTrack, "COMMON"] when a track is assigned, ["COMMON"] otherwise.
     */
    private List<String> resolveTracks(ExamSession session) {
        return assignmentRepository
                .findByExamIdAndStudentId(
                        session.getExam().getId(),
                        session.getStudent().getId())
                .map(a -> (a.getTrack() != null && !a.getTrack().isBlank())
                        ? List.of(a.getTrack(), "COMMON")
                        : List.of("COMMON"))
                .orElse(List.of("COMMON"));
    }

    private boolean isCorrectlyAnswered(Long sessionId, Long questionId) {
        return answerRepository
                .findBySessionIdAndQuestionId(sessionId, questionId)
                .map(a -> Boolean.TRUE.equals(a.getIsCorrect()))
                .orElse(false);
    }
}
