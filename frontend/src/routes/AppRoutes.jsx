import { Routes, Route, Link } from "react-router-dom";

// Public
import Landing from "../pages/Landing/Landing";
import Login from "../pages/Login/Login";
import Docs from "../pages/Docs";

// Student
import StudentDashboard from "../pages/Student/StudentDashboard";
import LiveExam from "../pages/Student/LiveExam";
import Results from "../pages/Student/Results";
import Profile from "../pages/Student/Profile";
import Settings from "../pages/Student/Settings";

// Super Admin
import SuperAdminDashboard from "../pages/SuperAdmin/SuperAdminDashboard";
import SuperAdminOrganizations from "../pages/SuperAdmin/SuperAdminOrganizations";
import SuperAdminUsers from "../pages/SuperAdmin/SuperAdminUsers";
import SuperAdminExams from "../pages/SuperAdmin/SuperAdminExams";
import SuperAdminSettings from "../pages/SuperAdmin/SuperAdminSettings";
import SuperAdminLiveSessions from "../pages/SuperAdmin/SuperAdminLiveSessions";
import SuperAdminAnalytics from "../pages/SuperAdmin/SuperAdminAnalytics";
import SuperAdminSystemHealth from "../pages/SuperAdmin/SuperAdminSystemHealth";

// Organization
import OrganizationDashboard from "../pages/Organization/OrganizationDashboard";
import Students from "../pages/Organization/Students";
import Examiners from "../pages/Organization/Examiners";
import Proctors from "../pages/Organization/Proctors";
import ActiveExams from "../pages/Organization/ActiveExams";
import UpcomingExams from "../pages/Organization/UpcomingExams";

// Examiner
import ExaminerDashboard from "../pages/Examiner/ExaminerDashboard";
import QuestionBank from "../pages/Examiner/QuestionBank";

// Proctor
import ProctorDashboard from "../pages/Proctor/ProctorDashboard";

// Route protection
import ProtectedRoute from "./ProtectedRoute";

// 404
import NotFound from "../pages/NotFound/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}

      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/docs" element={<Docs />} />

      {/* ================= STUDENT ROUTES ================= */}

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/live-exam"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <LiveExam />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/results"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/settings"
        element={
          <ProtectedRoute allowedRoles={["STUDENT"]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* ================= SUPER ADMIN ROUTES ================= */}

      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/organizations"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminOrganizations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/users"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/exams"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/live-sessions"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminLiveSessions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/analytics"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminAnalytics />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/system-health"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminSystemHealth />
          </ProtectedRoute>
        }
      />

      <Route
        path="/super-admin/settings"
        element={
          <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
            <SuperAdminSettings />
          </ProtectedRoute>
        }
      />

      {/* ================= ORGANIZATION ADMIN ROUTES ================= */}

      <Route
        path="/organization/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <OrganizationDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization/students"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <Students />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization/examiners"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <Examiners />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization/proctors"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <Proctors />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization/active-exams"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <ActiveExams />
          </ProtectedRoute>
        }
      />

      <Route
        path="/organization/upcoming-exams"
        element={
          <ProtectedRoute allowedRoles={["ORG_ADMIN"]}>
            <UpcomingExams />
          </ProtectedRoute>
        }
      />

      {/* ================= EXAMINER ROUTES ================= */}

      <Route
        path="/examiner/dashboard"
        element={
          <ProtectedRoute allowedRoles={["EXAM_CREATOR"]}>
            <ExaminerDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/examiner/question-bank"
        element={
          <ProtectedRoute allowedRoles={["EXAM_CREATOR"]}>
            <QuestionBank />
          </ProtectedRoute>
        }
      />

      {/* ================= PROCTOR ROUTES ================= */}

      <Route
        path="/proctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["PROCTOR"]}>
            <ProctorDashboard />
          </ProtectedRoute>
        }
      />

      {/* ================= UNAUTHORIZED ================= */}

      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center px-6">
            <div className="text-center max-w-md">
              <div className="text-6xl font-bold text-purple-500 mb-4">
                403
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                Access Denied
              </h1>

              <p className="text-slate-400 text-sm mb-6">
                You do not have permission to access this page.
              </p>

              <Link
                to="/login"
                className="inline-block px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition"
              >
                Go to Login
              </Link>
            </div>
          </div>
        }
      />

      {/* ================= 404 ================= */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;

