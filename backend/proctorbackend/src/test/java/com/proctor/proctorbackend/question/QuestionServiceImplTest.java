package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.session.ExamSessionRepository;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.question.dto.QuestionRequest;
import com.proctor.proctorbackend.question.dto.QuestionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuestionServiceImplTest {

    @Mock QuestionRepository questionRepository;
    @Mock ExamRepository examRepository;
    @Mock UserRepository userRepository;
    @Mock ExamAssignmentRepository assignmentRepository;
    @Mock ExamSessionRepository sessionRepository;
    @InjectMocks QuestionServiceImpl service;

    private final Organization orgA = Organization.builder().id(1L).name("A").slug("a").build();
    private final Organization orgB = Organization.builder().id(2L).name("B").slug("b").build();

    Exam exam;

    @BeforeEach
    void setUp() {
        exam = Exam.builder().id(10L).title("SDE1 Exam").organization(orgA).build();
        lenient().when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.of(
                User.builder().id(7L).email("u@x.com").role(Role.EXAM_CREATOR).organization(orgA).build()));
    }

    private QuestionRequest mcqRequest() {
        QuestionRequest req = new QuestionRequest();
        req.setExamId(10L);
        req.setQuestionType(QuestionType.MCQ);
        req.setQuestionText("What is JVM?");
        req.setOptions(Map.of("A", "Java Virtual Machine", "B", "Java Variable Method"));
        req.setCorrectOption("A");
        req.setMarks(5);
        return req;
    }

    @Test
    void createQuestion_defaultsTrackToCommonWhenNotProvided() {
        QuestionRequest req = mcqRequest();
        req.setTrack(null);

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(questionRepository.save(any())).thenAnswer(inv -> {
            Question q = inv.getArgument(0, Question.class);
            return Question.builder().id(1L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track(q.getTrack()).build();
        });

        QuestionResponse resp = service.createQuestion(req, "u@x.com");

        assertEquals("COMMON", resp.getTrack());
    }

    @Test
    void createQuestion_preservesExplicitTrack() {
        QuestionRequest req = mcqRequest();
        req.setTrack("SDE1");

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(questionRepository.save(any())).thenAnswer(inv -> {
            Question q = inv.getArgument(0, Question.class);
            return Question.builder().id(1L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track(q.getTrack()).build();
        });

        QuestionResponse resp = service.createQuestion(req, "u@x.com");

        assertEquals("SDE1", resp.getTrack());
    }

    @Test
    void createQuestion_mcqThrowsWhenCorrectOptionNotInOptions() {
        QuestionRequest req = mcqRequest();
        req.setCorrectOption("Z");

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req, "u@x.com"));
        verify(questionRepository, never()).save(any());
    }

    @Test
    void createQuestion_mcqThrowsWhenLessThanTwoOptions() {
        QuestionRequest req = mcqRequest();
        req.setOptions(Map.of("A", "Only one option"));

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req, "u@x.com"));
    }

    @Test
    void createQuestion_trueFalseAutoGeneratesOptions() {
        QuestionRequest req = new QuestionRequest();
        req.setExamId(10L);
        req.setQuestionType(QuestionType.TRUE_FALSE);
        req.setQuestionText("Is Java OOP?");
        req.setCorrectOption("True");
        req.setMarks(2);

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(questionRepository.save(any())).thenAnswer(inv -> {
            Question q = inv.getArgument(0, Question.class);
            return Question.builder().id(2L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track("COMMON").build();
        });

        QuestionResponse resp = service.createQuestion(req, "u@x.com");

        assertNotNull(resp.getOptions());
        assertTrue(resp.getOptions().containsKey("True"));
        assertTrue(resp.getOptions().containsKey("False"));
    }

    @Test
    void createQuestion_trueFalseThrowsForInvalidCorrectOption() {
        QuestionRequest req = new QuestionRequest();
        req.setExamId(10L);
        req.setQuestionType(QuestionType.TRUE_FALSE);
        req.setQuestionText("Is Java OOP?");
        req.setCorrectOption("Maybe");
        req.setMarks(2);

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req, "u@x.com"));
    }

    @Test
    void createQuestion_codingThrowsWhenMetadataMissing() {
        QuestionRequest req = new QuestionRequest();
        req.setExamId(10L);
        req.setQuestionType(QuestionType.CODING);
        req.setQuestionText("Reverse a string");
        req.setMarks(10);
        req.setMetadata(null);

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req, "u@x.com"));
    }

    @Test
    void createQuestion_codingThrowsWhenLanguageMissing() {
        QuestionRequest req = new QuestionRequest();
        req.setExamId(10L);
        req.setQuestionType(QuestionType.CODING);
        req.setQuestionText("Reverse a string");
        req.setMarks(10);
        req.setMetadata(Map.of("testCases", "[]"));

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req, "u@x.com"));
    }

    // --- getQuestionById / getQuestionsByExam access control ---

    private Question mcq() {
        exam.setOrganization(orgA);
        return Question.builder().id(1L).exam(exam).questionType(QuestionType.MCQ)
                .questionText("What is JVM?").options(Map.of("A", "JVM", "B", "JRE"))
                .correctOption("A").marks(5).track("COMMON").build();
    }

    private User user(Role role, Organization org) {
        User u = User.builder().id(7L).email("u@x.com").role(role).organization(org).build();
        when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.of(u));
        return u;
    }

    @Test
    void getQuestionById_studentNeverGetsAnswer_evenWhenRequested() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.STUDENT, orgA);
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 7L)).thenReturn(true);

        QuestionResponse resp = service.getQuestionById(1L, true, "u@x.com");

        assertNull(resp.getCorrectOption());
    }

    @Test
    void getQuestionById_unassignedStudentRejected() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.STUDENT, orgA);
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 7L)).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> service.getQuestionById(1L, false, "u@x.com"));
    }

    @Test
    void getQuestionById_sameOrgCreatorSeesAnswer() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.EXAM_CREATOR, orgA);

        assertEquals("A", service.getQuestionById(1L, true, "u@x.com").getCorrectOption());
    }

    @Test
    void getQuestionById_otherOrgStaffRejected() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.EXAM_CREATOR, orgB);

        assertThrows(UnauthorizedException.class, () -> service.getQuestionById(1L, true, "u@x.com"));
    }

    @Test
    void getQuestionsByExam_otherOrgStaffRejected() {
        mcq();
        user(Role.PROCTOR, orgB);
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(UnauthorizedException.class, () -> service.getQuestionsByExam(10L, true, "u@x.com"));
    }

    @Test
    void createQuestion_otherOrgStaffRejected() {
        user(Role.EXAM_CREATOR, orgB);
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(UnauthorizedException.class, () -> service.createQuestion(mcqRequest(), "u@x.com"));
        verify(questionRepository, never()).save(any());
    }

    @Test
    void updateQuestion_otherOrgStaffRejected() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.EXAM_CREATOR, orgB);

        assertThrows(UnauthorizedException.class, () -> service.updateQuestion(1L, mcqRequest(), "u@x.com"));
        verify(questionRepository, never()).save(any());
    }

    @Test
    void deleteQuestion_otherOrgStaffRejected() {
        when(questionRepository.findById(1L)).thenReturn(Optional.of(mcq()));
        user(Role.EXAM_CREATOR, orgB);

        assertThrows(UnauthorizedException.class, () -> service.deleteQuestion(1L, "u@x.com"));
        verify(questionRepository, never()).delete(any());
    }
}
