package com.proctor.proctorbackend.assignment;

import com.proctor.proctorbackend.assignment.dto.AssignmentRequest;
import com.proctor.proctorbackend.assignment.dto.AssignmentResponse;
import com.proctor.proctorbackend.common.enums.Role;
import com.proctor.proctorbackend.common.exception.BadRequestException;
import com.proctor.proctorbackend.common.exception.UnauthorizedException;
import com.proctor.proctorbackend.exam.Exam;
import com.proctor.proctorbackend.exam.ExamRepository;
import com.proctor.proctorbackend.organization.Organization;
import com.proctor.proctorbackend.user.User;
import com.proctor.proctorbackend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceImplTest {

    @Mock ExamAssignmentRepository assignmentRepository;
    @Mock ExamRepository examRepository;
    @Mock UserRepository userRepository;
    @InjectMocks AssignmentServiceImpl service;

    Organization org;
    Exam exam;
    User admin;
    User student;

    @BeforeEach
    void setUp() {
        org = Organization.builder().id(1L).name("Infosys").slug("infosys").isActive(true).build();
        exam = Exam.builder().id(10L).title("SDE1 Exam").organization(org).build();
        admin = User.builder().id(1L).email("admin@infosys.com").role(Role.ORG_ADMIN).organization(org).build();
        student = User.builder().id(2L).email("rahul@gmail.com").role(Role.STUDENT).organization(org).appliedRole("SDE1").build();
    }

    @Test
    void assignStudent_setsTrackFromAppliedRole() {
        AssignmentRequest req = new AssignmentRequest();
        req.setExamId(10L);
        req.setStudentId(2L);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(admin));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(false);
        when(assignmentRepository.save(any())).thenAnswer(inv -> {
            ExamAssignment a = inv.getArgument(0);
            return ExamAssignment.builder().id(1L).exam(a.getExam())
                    .student(a.getStudent()).organization(a.getOrganization()).track(a.getTrack()).build();
        });

        AssignmentResponse resp = service.assignStudent(req, "admin@infosys.com");

        assertEquals("SDE1", resp.getTrack());
        verify(assignmentRepository).save(argThat(a -> "SDE1".equals(a.getTrack())));
    }

    @Test
    void assignStudent_throwsWhenAlreadyAssigned() {
        AssignmentRequest req = new AssignmentRequest();
        req.setExamId(10L);
        req.setStudentId(2L);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(admin));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> service.assignStudent(req, "admin@infosys.com"));
        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void assignStudent_throwsWhenStudentFromDifferentOrg() {
        Organization otherOrg = Organization.builder().id(99L).name("TCS").slug("tcs").isActive(true).build();
        User outsider = User.builder().id(3L).email("x@tcs.com").role(Role.STUDENT).organization(otherOrg).build();

        AssignmentRequest req = new AssignmentRequest();
        req.setExamId(10L);
        req.setStudentId(3L);

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(admin));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(userRepository.findById(3L)).thenReturn(Optional.of(outsider));

        assertThrows(UnauthorizedException.class, () -> service.assignStudent(req, "admin@infosys.com"));
    }

    @Test
    void assignAllStudents_skipsAlreadyAssignedStudents() {
        User student2 = User.builder().id(3L).email("priya@gmail.com")
                .role(Role.STUDENT).organization(org).appliedRole("SDE2").build();

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(admin));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(userRepository.findByOrganizationIdAndRole(1L, Role.STUDENT)).thenReturn(List.of(student, student2));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 2L)).thenReturn(true);
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 3L)).thenReturn(false);
        when(assignmentRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<ExamAssignment> list = inv.getArgument(0);
            return list.stream().map(a -> ExamAssignment.builder().id(99L).exam(a.getExam())
                    .student(a.getStudent()).organization(a.getOrganization()).track(a.getTrack()).build()).toList();
        });

        List<AssignmentResponse> result = service.assignAllStudents(10L, "admin@infosys.com");

        assertEquals(1, result.size());
        assertEquals("SDE2", result.get(0).getTrack());
    }

    @Test
    void assignAllStudents_setsNullTrackWhenAppliedRoleIsNull() {
        User noTrackStudent = User.builder().id(4L).email("amit@gmail.com")
                .role(Role.STUDENT).organization(org).appliedRole(null).build();

        when(userRepository.findByEmail("admin@infosys.com")).thenReturn(Optional.of(admin));
        when(examRepository.findById(10L)).thenReturn(Optional.of(exam));
        when(userRepository.findByOrganizationIdAndRole(1L, Role.STUDENT)).thenReturn(List.of(noTrackStudent));
        when(assignmentRepository.existsByExamIdAndStudentId(10L, 4L)).thenReturn(false);
        when(assignmentRepository.saveAll(anyList())).thenAnswer(inv -> {
            List<ExamAssignment> list = inv.getArgument(0);
            return list.stream().map(a -> ExamAssignment.builder().id(1L).exam(a.getExam())
                    .student(a.getStudent()).organization(a.getOrganization()).track(a.getTrack()).build()).toList();
        });

        List<AssignmentResponse> result = service.assignAllStudents(10L, "admin@infosys.com");

        assertEquals(1, result.size());
        assertNull(result.get(0).getTrack());
    }
}
