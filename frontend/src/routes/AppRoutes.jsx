import { Routes, Route } from "react-router-dom";

import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";

import StudentDashboard from "../pages/Student/StudentDashboard";
import LiveExam from "../pages/Student/LiveExam";
import Results from "../pages/Student/Results";
import Profile from "../pages/Student/Profile";
import Settings from "../pages/Student/Settings"; // Student Settings

// Super Admin Imports
import SuperAdminDashboard from "../pages/SuperAdmin/SuperAdminDashboard";
import SuperAdminOrganizations from "../pages/SuperAdmin/SuperAdminOrganizations";
import SuperAdminUsers from "../pages/SuperAdmin/SuperAdminUsers";
import SuperAdminExams from "../pages/SuperAdmin/SuperAdminExams";
import SuperAdminSettings from "../pages/SuperAdmin/SuperAdminSettings"; // Super Admin Settings
import SuperAdminLiveSessions from "../pages/SuperAdmin/SuperAdminLiveSessions";
import SuperAdminAnalytics from "../pages/SuperAdmin/SuperAdminAnalytics";
import SuperAdminSystemHealth from "../pages/SuperAdmin/SuperAdminSystemHealth";

import ProtectedRoute from "./ProtectedRoute";
import NotFound from "../pages/NotFound/NotFound";
import OrganizationDashboard from "../pages/Organization/OrganizationDashboard";
import Students from "../pages/Organization/Students";
import Examiners from "../pages/Organization/Examiners";
import Proctors from "../pages/Organization/Proctors";
import ActiveExams from "../pages/Organization/ActiveExams";
import UpcomingExams from "../pages/Organization/UpcomingExams";
import ExaminerDashboard from "../pages/Examiner/ExaminerDashboard";
import ProctorDashboard from "../pages/Proctor/ProctorDashboard";

function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />


      {/* ================= STUDENT ROUTES ================= */}
      <Route
        path="/student/dashboard"
        element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>}
      />
      <Route
        path="/student/live-exam"
        element={<ProtectedRoute><LiveExam /></ProtectedRoute>}
      />
      <Route
        path="/student/results"
        element={<ProtectedRoute><Results /></ProtectedRoute>}
      />
      <Route
        path="/student/profile"
        element={<ProtectedRoute><Profile /></ProtectedRoute>}
      />
      <Route
        path="/student/settings" // Updated path for Student Settings
        element={<ProtectedRoute><Settings /></ProtectedRoute>}
      />


      {/* ================= SUPER ADMIN ROUTES ================= */}
      <Route
        path="/super-admin/dashboard"
        element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/organizations"
        element={<ProtectedRoute><SuperAdminOrganizations /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/users"
        element={<ProtectedRoute><SuperAdminUsers /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/exams"
        element={<ProtectedRoute><SuperAdminExams /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/live-sessions"
        element={<ProtectedRoute><SuperAdminLiveSessions /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/analytics"
        element={<ProtectedRoute><SuperAdminAnalytics /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/system-health"
        element={<ProtectedRoute><SuperAdminSystemHealth /></ProtectedRoute>}
      />
      <Route
        path="/super-admin/settings" // Super Admin Settings
        element={<ProtectedRoute><SuperAdminSettings /></ProtectedRoute>}
      />


      {/* ================= ORGANIZATION ADMIN ================= */}
      <Route
        path="/organization/dashboard"
        element={<ProtectedRoute><OrganizationDashboard /></ProtectedRoute>}
      />
      <Route
        path="/organization/students"
        element={<ProtectedRoute><Students /></ProtectedRoute>}
      />
      <Route
        path="/organization/examiners"
        element={<ProtectedRoute><Examiners /></ProtectedRoute>}
      />
      <Route 
        path="/organization/proctors" 
        element={<ProtectedRoute><Proctors /></ProtectedRoute>} 
      />
      <Route 
        path="/organization/active-exams" 
        element={<ProtectedRoute><ActiveExams /></ProtectedRoute>} 
      />
      <Route 
        path="/organization/upcoming-exams" 
        element={<ProtectedRoute><UpcomingExams /></ProtectedRoute>} 
      />


      {/* ================= EXAMINER & PROCTOR ROUTES ================= */}
      <Route 
        path="/examiner/dashboard" 
        element={<ProtectedRoute><ExaminerDashboard /></ProtectedRoute>} 
      />
      <Route 
        path="/proctor/dashboard" 
        element={<ProtectedRoute><ProctorDashboard /></ProtectedRoute>} 
      />


      {/* ================= 404 ================= */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

export default AppRoutes;