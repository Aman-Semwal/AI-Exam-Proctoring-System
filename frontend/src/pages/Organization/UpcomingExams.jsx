import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaPlus, FaEye, FaUserPlus, FaTrash, FaTimes, FaCalendarAlt, FaClock, FaUserMinus } from "react-icons/fa";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import api from "../../services/api";

export default function UpcomingExams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Actions
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [detailExam, setDetailExam] = useState(null);
  const [deleteExamTarget, setDeleteExamTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [assigningExam, setAssigningExam] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // ── NEW: Assigned students per exam ─────────────────────────────────────────
  const [examAssignments, setExamAssignments] = useState({}); // { [examId]: AssignmentResponse[] }
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // ── NEW: Individual assign form ──────────────────────────────────────────────
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignStudentEmail, setAssignStudentEmail] = useState("");
  const [assigningIndividual, setAssigningIndividual] = useState(false);

  // ── NEW: Per-row remove loading ──────────────────────────────────────────────
  const [removingAssignmentId, setRemovingAssignmentId] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  // Schedule Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    durationMinutes: "60",
    startTime: "",
    endTime: "",
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadUpcomingExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/exams");

      const data = response.data?.data;
      const examList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(response.data)
        ? response.data
        : [];

      setExams(examList);
    } catch (err) {
      console.error("Failed to load upcoming exams:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load upcoming exams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingExams();
  }, []);

  // ── NEW: Fetch assigned students when detail modal opens ─────────────────────
  useEffect(() => {
    if (!detailExam) return;

    const fetchAssignments = async () => {
      try {
        setAssignmentsLoading(true);
        const res = await api.get(`/assignments/exam/${detailExam.id}`);
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
        setExamAssignments((prev) => ({ ...prev, [detailExam.id]: list }));
      } catch (err) {
        console.error("Failed to load assignments:", err);
        setExamAssignments((prev) => ({ ...prev, [detailExam.id]: [] }));
      } finally {
        setAssignmentsLoading(false);
      }
    };

    fetchAssignments();
    // Reset individual-assign form state on modal open
    setShowAssignForm(false);
    setAssignStudentEmail("");
  }, [detailExam?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingExams = useMemo(() => {
    const now = new Date();

    return exams
      .filter((exam) => {
        const status = String(exam.status || "").toUpperCase();

        if (["COMPLETED", "CANCELLED", "CANCELED"].includes(status)) {
          return false;
        }

        const examDate = exam.startTime || exam.startDate || exam.date;

        if (examDate) {
          const parsedDate = new Date(examDate);

          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate >= now;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.startTime || a.startDate || a.date || 0
        ).getTime();

        const dateB = new Date(
          b.startTime || b.startDate || b.date || 0
        ).getTime();

        return dateA - dateB;
      });
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return upcomingExams;

    return upcomingExams.filter((exam) => {
      const title = String(
        exam.title || exam.name || exam.examTitle || ""
      ).toLowerCase();

      const course = String(
        exam.course || exam.courseCode || exam.subject || ""
      ).toLowerCase();

      const examiner = String(
        exam.assignedExaminer ||
          exam.examinerName ||
          exam.createdByName ||
          exam.examiner ||
          ""
      ).toLowerCase();

      return (
        title.includes(query) ||
        course.includes(query) ||
        examiner.includes(query)
      );
    });
  }, [upcomingExams, searchQuery]);

  // Schedule Exam Handler
  const handleScheduleExam = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.durationMinutes || !form.startTime || !form.endTime) {
      setToast({ type: "error", message: "Please fill in all required fields." });
      return;
    }

    const start = new Date(form.startTime);
    const end = new Date(form.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setToast({ type: "error", message: "Invalid start or end date." });
      return;
    }

    if (end <= start) {
      setToast({ type: "error", message: "End time must be after start time." });
      return;
    }

    try {
      setScheduling(true);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        durationMinutes: Number(form.durationMinutes),
        startTime: form.startTime,
        endTime: form.endTime,
      };

      await api.post("/exams", payload);

      setToast({ type: "success", message: `Exam "${form.title}" scheduled successfully!` });
      setShowScheduleModal(false);
      setForm({
        title: "",
        description: "",
        durationMinutes: "60",
        startTime: "",
        endTime: "",
      });

      await loadUpcomingExams();
    } catch (err) {
      console.error("Failed to schedule exam:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to schedule exam. Please try again.",
      });
    } finally {
      setScheduling(false);
    }
  };

  // Assign All Students Handler
  const handleAssignAllStudents = async (exam) => {
    try {
      setAssigning(true);
      const res = await api.post(`/assignments/exam/${exam.id}/assign-all`);
      const count = res.data?.data?.length ?? "All eligible";
      setToast({
        type: "success",
        message: `Successfully assigned ${count} student(s) to "${exam.title || "the exam"}".`,
      });
      setAssigningExam(null);
      await loadUpcomingExams();
    } catch (err) {
      console.error("Assign all error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to assign students to exam.",
      });
    } finally {
      setAssigning(false);
    }
  };

  // Delete Exam Handler
  const handleDeleteExam = async () => {
    if (!deleteExamTarget) return;

    try {
      setDeleting(true);
      await api.delete(`/exams/${deleteExamTarget.id}`);
      setToast({
        type: "success",
        message: `Exam "${deleteExamTarget.title || "Exam"}" deleted successfully.`,
      });
      setDeleteExamTarget(null);
      await loadUpcomingExams();
    } catch (err) {
      console.error("Delete exam error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete exam.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // ── NEW: Assign individual student handler ───────────────────────────────────
  const handleAssignIndividual = async (e) => {
    e.preventDefault();
    if (!detailExam || !assignStudentEmail.trim()) return;

    try {
      setAssigningIndividual(true);
      const res = await api.post("/assignments", {
        examId: Number(detailExam.id),
        studentEmail: assignStudentEmail.trim(),
      });

      // Build the new assignment object from the response
      const newAssignment =
        res.data?.data ?? res.data ?? {
          examId: detailExam.id,
          studentEmail: assignStudentEmail.trim(),
        };

      setExamAssignments((prev) => ({
        ...prev,
        [detailExam.id]: [...(prev[detailExam.id] || []), newAssignment],
      }));

      setToast({
        type: "success",
        message: `Student "${assignStudentEmail.trim()}" assigned successfully.`,
      });
      setAssignStudentEmail("");
      setShowAssignForm(false);
    } catch (err) {
      console.error("Assign individual error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to assign student.",
      });
    } finally {
      setAssigningIndividual(false);
    }
  };

  // ── NEW: Remove individual assignment handler ────────────────────────────────
  const handleRemoveAssignment = async (assignmentId) => {
    if (!detailExam) return;

    try {
      setRemovingAssignmentId(assignmentId);
      await api.delete(`/assignments/${assignmentId}`);

      setExamAssignments((prev) => ({
        ...prev,
        [detailExam.id]: (prev[detailExam.id] || []).filter(
          (a) => a.id !== assignmentId
        ),
      }));

      setToast({ type: "success", message: "Student removed from exam." });
    } catch (err) {
      console.error("Remove assignment error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to remove student.",
      });
    } finally {
      setRemovingAssignmentId(null);
    }
  };

  // Derived list of assignments for the currently open detail modal
  const currentAssignments =
    detailExam ? (examAssignments[detailExam.id] ?? null) : null;

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      <OrganizationSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Upcoming Exams Schedule
            </h1>
            <p className="text-[11px] text-slate-400">
              Plan, review, and organize upcoming academic assessments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              {(currentUser?.name || "OA").slice(0, 2).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser?.name || "Organization Admin"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Organization Admin
              </p>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Timetable
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Scheduled Assessments
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Manage examination timetables and registered candidates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
            >
              <FaPlus size={11} />
              Schedule New Exam
            </button>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search upcoming exams by title, course, or examiner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total Scheduled:{" "}
                <span className="font-semibold text-white">
                  {filteredExams.length}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={loadUpcomingExams}
                  className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading upcoming exams...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Exam Details</th>
                      <th className="pb-3 px-3">Date & Time</th>
                      <th className="pb-3 px-3">Assigned Examiner</th>
                      <th className="pb-3 px-3">Registered Students</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <UpcomingExamRow
                          key={exam.id}
                          exam={exam}
                          onView={() => setDetailExam(exam)}
                          onAssign={() => setAssigningExam(exam)}
                          onDelete={() => setDeleteExamTarget(exam)}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          No upcoming exams found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Schedule Exam Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#121520] border border-white/[0.1] rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.07]">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Schedule New Exam
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set exam parameters, date timetable, and active duration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleScheduleExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Architecture End-Sem"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Instructions or exam details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  placeholder="60"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.03]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold transition"
                >
                  {scheduling ? "Scheduling..." : "Schedule Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Exam Details Modal (expanded with assigned students) ── */}
      {detailExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121520] border border-white/[0.1] rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.07]">
              <h3 className="text-base font-bold text-white">Exam Details</h3>
              <button
                type="button"
                onClick={() => setDetailExam(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* Basic exam info */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Title</span>
                <p className="font-semibold text-white text-sm mt-0.5">{detailExam.title || "Untitled"}</p>
              </div>

              {detailExam.description && (
                <div>
                  <span className="text-slate-500 block">Description</span>
                  <p className="text-slate-300 mt-0.5">{detailExam.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Duration</span>
                  <p className="font-mono font-semibold text-blue-400 mt-1">
                    {detailExam.durationMinutes || detailExam.duration || 60} mins
                  </p>
                </div>

                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Status</span>
                  <p className="font-mono font-semibold text-emerald-400 mt-1">
                    {detailExam.status || "SCHEDULED"}
                  </p>
                </div>
              </div>

              <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05] space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <FaCalendarAlt className="text-blue-400" size={11} />
                  <span>Start: {detailExam.startTime ? new Date(detailExam.startTime).toLocaleString() : "Not set"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <FaClock className="text-amber-400" size={11} />
                  <span>End: {detailExam.endTime ? new Date(detailExam.endTime).toLocaleString() : "Not set"}</span>
                </div>
              </div>
            </div>

            {/* ── Assigned Students Section ── */}
            <div className="mt-5 pt-4 border-t border-white/[0.07]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Assigned Students
                  {currentAssignments !== null && (
                    <span className="ml-2 text-slate-500 normal-case font-normal">
                      ({currentAssignments.length})
                    </span>
                  )}
                </h4>

                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm((v) => !v);
                    setAssignStudentEmail("");
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition"
                >
                  <FaUserPlus size={10} />
                  Assign Student
                </button>
              </div>

              {/* Individual assign inline form */}
              {showAssignForm && (
                <form
                  onSubmit={handleAssignIndividual}
                  className="flex gap-2 mb-3"
                >
                  <input
                    type="email"
                    required
                    placeholder="student@email.com"
                    value={assignStudentEmail}
                    onChange={(e) => setAssignStudentEmail(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  <button
                    type="submit"
                    disabled={assigningIndividual || !assignStudentEmail.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition whitespace-nowrap"
                  >
                    {assigningIndividual ? "Assigning…" : "Assign"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAssignForm(false); setAssignStudentEmail(""); }}
                    className="px-2 py-1.5 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white text-xs transition"
                  >
                    <FaTimes size={10} />
                  </button>
                </form>
              )}

              {/* Assigned students list */}
              {assignmentsLoading ? (
                <p className="text-xs text-slate-500 py-3 text-center">Loading assigned students…</p>
              ) : currentAssignments === null || currentAssignments.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No students assigned yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {currentAssignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-2 bg-[#090a0f] border border-white/[0.05] rounded-lg px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {assignment.studentName || "—"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {assignment.studentEmail || "—"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Track badge */}
                        {assignment.track && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                            {assignment.track}
                          </span>
                        )}

                        {/* Assigned at */}
                        {assignment.assignedAt && (
                          <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap hidden sm:inline">
                            {new Date(assignment.assignedAt).toLocaleDateString()}
                          </span>
                        )}

                        {/* Remove button */}
                        <button
                          type="button"
                          disabled={removingAssignmentId === assignment.id}
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 disabled:opacity-40 transition"
                          title="Remove student"
                        >
                          <FaUserMinus size={11} />
                          <span className="hidden sm:inline">
                            {removingAssignmentId === assignment.id ? "Removing…" : "Remove"}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailExam(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign All Students Confirm Dialog */}
      {assigningExam && (
        <ConfirmDialog
          isOpen={Boolean(assigningExam)}
          title="Assign All Students"
          message={`Are you sure you want to enroll and assign all eligible students in your organization to "${assigningExam.title || "this exam"}"?`}
          confirmText={assigning ? "Assigning..." : "Assign All"}
          isDestructive={false}
          onConfirm={() => handleAssignAllStudents(assigningExam)}
          onCancel={() => setAssigningExam(null)}
        />
      )}

      {/* Delete Exam Confirm Dialog */}
      {deleteExamTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteExamTarget)}
          title="Delete Exam Schedule"
          message={`Are you sure you want to delete "${deleteExamTarget.title || "this exam"}"? This will cancel scheduled sessions and cannot be undone.`}
          confirmText={deleting ? "Deleting..." : "Delete Exam"}
          isDestructive={true}
          onConfirm={handleDeleteExam}
          onCancel={() => setDeleteExamTarget(null)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

const UpcomingExamRow = ({ exam, onView, onAssign, onDelete }) => {
  const title =
    exam.title || exam.name || exam.examTitle || "Untitled Exam";

  const course =
    exam.course || exam.courseCode || exam.subject || "N/A";

  const examiner =
    exam.assignedExaminer ||
    exam.examinerName ||
    exam.createdByName ||
    exam.examiner ||
    "Not Assigned";

  const registeredStudents =
    exam.totalRegistered ??
    exam.totalStudents ??
    exam.registeredStudents ??
    exam.studentCount ??
    0;

  const rawDate = exam.startTime || exam.startDate || exam.date;

  const parsedDate = rawDate ? new Date(rawDate) : null;

  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime());

  const formattedDate = validDate
    ? parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : exam.date || "Date not set";

  const formattedTime = validDate
    ? parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : exam.time || "Time not set";

  const menuItems = [
    {
      label: "View Details",
      icon: FaEye,
      onClick: onView,
    },
    {
      label: "Assign All Students",
      icon: FaUserPlus,
      onClick: onAssign,
    },
    {
      label: "Delete Exam",
      icon: FaTrash,
      onClick: onDelete,
      danger: true,
    },
  ];

  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div>
          <p className="font-semibold text-white">{title}</p>

          <span className="inline-block font-mono text-[11px] text-blue-400 mt-0.5">
            {course}
          </span>
        </div>
      </td>

      <td className="py-3 px-3">
        <p className="font-medium text-white">{formattedDate}</p>

        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          {formattedTime}
        </p>
      </td>

      <td className="py-3 px-3 text-slate-300">
        {examiner}
      </td>

      <td className="py-3 px-3 text-slate-300 font-mono">
        {registeredStudents} candidates
      </td>

      <td className="py-3 px-3 text-right">
        <ActionDropdown items={menuItems} />
      </td>
    </tr>
  );
};
