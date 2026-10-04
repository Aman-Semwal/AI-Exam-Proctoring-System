package com.proctor.proctorbackend.answer;

import com.proctor.proctorbackend.answer.dto.AnswerRequest;
import com.proctor.proctorbackend.answer.dto.AnswerResponse;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.examproctor.ExamProctorService;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.question.QuestionType;
import com.proctor.proctorbackend.session.ExamSession;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.session.SessionStatus;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnswerServiceImplTest {

    @Mock AnswerRepository answerRepository;
    @Mock ExamSessionRepository sessionRepository;
    @Mock QuestionRepository questionRepository;
    @Mock UserRepository userRepository;
    @Mock ExamProctorService examProctorService;
    @InjectMocks AnswerServiceImpl service;

    Organization org;
    User student;
    ExamSession session;
    Question question;
    Answer answer;

    @BeforeEach
    void setUp() {
        org = Organization.builder().id(1L).build();
        student = User.builder().id(2L).email("s@a.com").role(Role.STUDENT).organization(org).build();
        Exam exam = Exam.builder().id(10L).organization(org).build();
        session = ExamSession.builder().id(55L).exam(exam).student(student).organization(org)
                .status(SessionStatus.ACTIVE).build();
        question = Question.builder().id(3L).exam(exam).questionType(QuestionType.MCQ)
                .options(Map.of("A", "x", "B", "y")).correctOption("B").questionText("q").build();
        answer = Answer.builder().id(9L).session(session).question(question).selectedOption("A").isCorrect(false).build();
        lenient().when(userRepository.findByEmail("s@a.com")).thenReturn(Optional.of(student));
        lenient().when(sessionRepository.findById(55L)).thenReturn(Optional.of(session));
    }

    private void actingAs(String email, Role role, Organization userOrg) {
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(
                User.builder().id(8L).email(email).role(role).organization(userOrg).build()));
    }

    @Test
    void submit_responseNeverRevealsCorrectness() {
        when(questionRepository.findById(3L)).thenReturn(Optional.of(question));
        when(answerRepository.findBySessionIdAndQuestionId(55L, 3L)).thenReturn(Optional.empty());
        when(answerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        AnswerRequest req = new AnswerRequest();
        req.setSessionId(55L);
        req.setQuestionId(3L);
        req.setSelectedOption("B");

        AnswerResponse resp = service.submitAnswer(req, "s@a.com");

        assertNull(resp.getIsCorrect(), "a student must not learn mid-exam whether an answer is right");
    }

    @Test
    void bySession_ownActiveSession_hidesCorrectness() {
        when(answerRepository.findBySessionId(55L)).thenReturn(List.of(answer));

        List<AnswerResponse> answers = service.getAnswersBySession(55L, "s@a.com");

        assertEquals("A", answers.get(0).getSelectedOption());
        assertNull(answers.get(0).getIsCorrect());
    }

    @Test
    void bySession_ownFinishedSession_showsCorrectness() {
        session.setStatus(SessionStatus.COMPLETED);
        when(answerRepository.findBySessionId(55L)).thenReturn(List.of(answer));

        assertEquals(Boolean.FALSE, service.getAnswersBySession(55L, "s@a.com").get(0).getIsCorrect());
    }

    @Test
    void bySession_anotherStudentsSession_rejected() {
        actingAs("other@a.com", Role.STUDENT, org);

        assertThrows(UnauthorizedException.class, () -> service.getAnswersBySession(55L, "other@a.com"));
        verify(answerRepository, never()).findBySessionId(any());
    }

    @Test
    void bySession_sameOrgExaminer_seesCorrectness() {
        actingAs("e@a.com", Role.EXAM_CREATOR, org);
        when(answerRepository.findBySessionId(55L)).thenReturn(List.of(answer));

        assertEquals(Boolean.FALSE, service.getAnswersBySession(55L, "e@a.com").get(0).getIsCorrect());
    }

    @Test
    void bySession_otherOrgStaff_rejected() {
        actingAs("x@b.com", Role.ORG_ADMIN, Organization.builder().id(2L).build());

        assertThrows(UnauthorizedException.class, () -> service.getAnswersBySession(55L, "x@b.com"));
    }

    @Test
    void byId_anotherStudentsAnswer_rejected() {
        actingAs("other@a.com", Role.STUDENT, org);
        when(answerRepository.findById(9L)).thenReturn(Optional.of(answer));

        assertThrows(UnauthorizedException.class, () -> service.getAnswerById(9L, "other@a.com"));
    }
}
