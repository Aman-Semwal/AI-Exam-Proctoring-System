package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;

import java.util.List;

/**
 * Business contract for question management.
 *
 * <h3>BUG-011 fix — removed unauthenticated 2-arg {@code getQuestionsByExam}</h3>
 * <p>The previous interface exposed two overloads:
 * <ul>
 *   <li>{@code getQuestionsByExam(Long examId, boolean includeAnswer)} — no caller identity,
 *       no org-scoping. Any service that called this internally would return questions from
 *       <em>any</em> exam, leaking cross-org data.</li>
 *   <li>{@code getQuestionsByExam(Long examId, boolean includeAnswer, String requesterEmail)}
 *       — the correct, authenticated, org-scoped variant.</li>
 * </ul>
 *
 * <p>The unauthenticated overload has been removed from this interface and made
 * {@code private} in {@link QuestionServiceImpl}. All callers — including
 * {@link com.proctor.proctorbackend.session.SessionController} — must go through the
 * authenticated 3-argument variant or {@link #getQuestionsForSession}.
 */
public interface QuestionService {

    QuestionResponse createQuestion(QuestionRequest request);

    QuestionResponse getQuestionById(Long id, boolean includeAnswer);

    /**
     * Returns questions for an exam, applying org-scoping and track-filtering
     * based on the caller's identity.
     *
     * <p>Students only see questions for their assigned track (+ COMMON).
     * Non-student roles see all questions for the exam (subject to org scope).
     *
     * @param examId         the exam to fetch questions for
     * @param includeAnswer  whether to include {@code correctOption} in the response
     *                       (always {@code false} for students regardless of this flag)
     * @param requesterEmail the email of the authenticated caller
     */
    List<QuestionResponse> getQuestionsByExam(Long examId, boolean includeAnswer, String requesterEmail);

    /**
     * Returns the student-facing questions for a specific exam session,
     * filtered to the student's assigned track.
     *
     * @param sessionId    the session whose exam questions to retrieve
     * @param studentEmail the email of the authenticated student
     */
    List<QuestionResponse> getQuestionsForSession(Long sessionId, String studentEmail);

    QuestionResponse updateQuestion(Long id, QuestionRequest request);

    void deleteQuestion(Long id);
}
