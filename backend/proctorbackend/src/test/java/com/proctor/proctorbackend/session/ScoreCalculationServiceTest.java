package com.proctor.proctorbackend.session;

import com.proctor.proctorbackend.answer.AnswerRepository;
import com.proctor.proctorbackend.assignment.ExamAssignment;
import com.proctor.proctorbackend.assignment.ExamAssignmentRepository;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.question.Question;
import com.proctor.proctorbackend.question.QuestionRepository;
import com.proctor.proctorbackend.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreCalculationServiceTest {

    @Mock QuestionRepository questionRepository;
    @Mock AnswerRepository answerRepository;
    @Mock ExamAssignmentRepository assignmentRepository;
    @InjectMocks ScoreCalculationService service;

    private final ExamSession session = ExamSession.builder().id(55L)
            .exam(Exam.builder().id(10L).build())
            .student(User.builder().id(2L).build())
            .build();

    @Test
    void totalMarks_sumsOnlyTheStudentsTrackPlusCommon() {
        when(assignmentRepository.findByExamIdAndStudentId(10L, 2L))
                .thenReturn(Optional.of(ExamAssignment.builder().track("SDE1").build()));
        when(questionRepository.findByExamIdAndTrackIn(10L, List.of("SDE1", "COMMON")))
                .thenReturn(List.of(Question.builder().marks(5).build(), Question.builder().marks(3).build()));

        assertEquals(8, service.totalMarks(session));
    }

    @Test
    void totalMarks_noExam_isZero() {
        assertEquals(0, service.totalMarks(ExamSession.builder().id(1L).build()));
    }
}
