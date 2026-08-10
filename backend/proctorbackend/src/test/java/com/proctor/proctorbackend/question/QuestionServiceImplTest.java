package com.proctor.proctorbackend.question;

import com.proctor.proctorbackend.common.exception.BadRequestException;
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
    @InjectMocks QuestionServiceImpl service;

    Exam exam;

    @BeforeEach
    void setUp() {
        exam = Exam.builder().id(10L).title("SDE1 Exam").build();
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
            Question q = inv.getArgument(0);
            q = Question.builder().id(1L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track(q.getTrack()).build();
            return q;
        });

        QuestionResponse resp = service.createQuestion(req);

        assertEquals("COMMON", resp.getTrack());
    }

    @Test
    void createQuestion_preservesExplicitTrack() {
        QuestionRequest req = mcqRequest();
        req.setTrack("SDE1");

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(questionRepository.save(any())).thenAnswer(inv -> {
            Question q = inv.getArgument(0);
            q = Question.builder().id(1L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track(q.getTrack()).build();
            return q;
        });

        QuestionResponse resp = service.createQuestion(req);

        assertEquals("SDE1", resp.getTrack());
    }

    @Test
    void createQuestion_mcqThrowsWhenCorrectOptionNotInOptions() {
        QuestionRequest req = mcqRequest();
        req.setCorrectOption("Z");

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req));
        verify(questionRepository, never()).save(any());
    }

    @Test
    void createQuestion_mcqThrowsWhenLessThanTwoOptions() {
        QuestionRequest req = mcqRequest();
        req.setOptions(Map.of("A", "Only one option"));

        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));

        assertThrows(BadRequestException.class, () -> service.createQuestion(req));
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
            Question q = inv.getArgument(0);
            q = Question.builder().id(2L).exam(q.getExam()).questionType(q.getQuestionType())
                    .questionText(q.getQuestionText()).options(q.getOptions())
                    .correctOption(q.getCorrectOption()).marks(q.getMarks()).track("COMMON").build();
            return q;
        });

        QuestionResponse resp = service.createQuestion(req);

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

        assertThrows(BadRequestException.class, () -> service.createQuestion(req));
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

        assertThrows(BadRequestException.class, () -> service.createQuestion(req));
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

        assertThrows(BadRequestException.class, () -> service.createQuestion(req));
    }

    @Test
    void getQuestionById_hidesCorrectOptionFromStudent() {
        Question q = Question.builder().id(1L).exam(exam).questionType(QuestionType.MCQ)
                .questionText("What is JVM?").options(Map.of("A", "JVM", "B", "JRE"))
                .correctOption("A").marks(5).track("COMMON").build();

        when(questionRepository.findById(1L)).thenReturn(Optional.of(q));

        QuestionResponse resp = service.getQuestionById(1L, false);

        assertNull(resp.getCorrectOption());
    }

    @Test
    void getQuestionById_showsCorrectOptionForAdmin() {
        Question q = Question.builder().id(1L).exam(exam).questionType(QuestionType.MCQ)
                .questionText("What is JVM?").options(Map.of("A", "JVM", "B", "JRE"))
                .correctOption("A").marks(5).track("COMMON").build();

        when(questionRepository.findById(1L)).thenReturn(Optional.of(q));

        QuestionResponse resp = service.getQuestionById(1L, true);

        assertEquals("A", resp.getCorrectOption());
    }
}
