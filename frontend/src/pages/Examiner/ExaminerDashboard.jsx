import { useEffect, useState, useCallback } from "react";
import {
  FaClipboardList,
  FaPlus,
  FaSearch,
  FaCheckCircle,
  FaFileAlt,
  FaSignOutAlt,
  FaTimes,
  FaEdit,
  FaTrash,
  FaQuestionCircle,
  FaChalkboardTeacher,
  FaChevronRight,
  FaCalculator,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

// ─── Tab IDs ─────────────────────────────────────────────────────────────────
const TAB_EXAMS = "my_exams";
const TAB_SESSIONS = "sessions_grading";

// ─── Helper: extract list from varied API response shapes ────────────────────
const extractList = (data) =>
  Array.isArray(data) ? data : data?.content || data?.exams || data?.sessions || [];

export default function ExaminerDashboard() {
  const navigate = useNavigate();

  // ── Active Tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(TAB_EXAMS);

  // ── My Exams Tab State ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  // Delete Confirmation
  const [deleteExam, setDeleteExam] = useState(null);

  // ── Sessions & Grading Tab State ────────────────────────────────────────────
  const [selectedExamId, setSelectedExamId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  // Result Panel (side panel)
  const [resultPanelOpen, setResultPanelOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [result, setResult] = useState(null); // { score, totalMarks, percentage, grade, breakdown[] }
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");

  // Grading in-flight tracker: answerId -> 'correct'|'incorrect'|null
  const [gradingInFlight, setGradingInFlight] = useState({});

  // Recalculate in-flight
  const [recalculating, setRecalculating] = useState(false);

  // ── Fetch exams (shared between both tabs) ──────────────────────────────────
  const fetchExams = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const response = await api.get("/exams/my");
      const data = response.data?.data;
      setExams(extractList(data));
    } catch (err) {
      console.error("Failed to fetch exams:", err);
      setError(err.response?.data?.message || "Unable to load your exams.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login", { replace: true });
    }
  };

  // ── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDuration("");
    setNewStartTime("");
    setNewEndTime("");
    setEditingExam(null);
  };

  const formatDateTimeForInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setMessage("");
    setIsModalOpen(true);
  };

  const openEditModal = (exam) => {
    setError("");
    setMessage("");
    setEditingExam(exam);
    setNewTitle(exam.title || "");
    setNewDescription(exam.description || "");
    setNewDuration(
      exam.durationMinutes !== undefined && exam.durationMinutes !== null
        ? String(exam.durationMinutes)
        : ""
    );
    setNewStartTime(formatDateTimeForInput(exam.startTime));
    setNewEndTime(formatDateTimeForInput(exam.endTime));
    setIsModalOpen(true);
  };

  const openQuestionBank = (exam) => {
    if (!exam?.id) { setError("Exam ID is missing."); return; }
    navigate(`/examiner/question-bank?examId=${exam.id}`);
  };

  // ── Create / Update exam ────────────────────────────────────────────────────
  const handleExamSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDuration || !newStartTime || !newEndTime) {
      setError("Please fill all required fields.");
      return;
    }
    const start = new Date(newStartTime);
    const end = new Date(newEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please enter valid start and end times.");
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setError("End time must be after start time.");
      return;
    }
    try {
      setCreating(true);
      setError("");
      setMessage("");
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        durationMinutes: Number(newDuration),
        startTime: newStartTime,
        endTime: newEndTime,
      };
      let response;
      if (editingExam) {
        response = await api.put(`/exams/${editingExam.id}`, payload);
        const updatedExam = response.data?.data;
        if (updatedExam) {
          setExams((prev) => prev.map((ex) => (ex.id === editingExam.id ? updatedExam : ex)));
        } else {
          await fetchExams(true);
        }
        setMessage("Exam updated successfully.");
      } else {
        response = await api.post("/exams", payload);
        const createdExam = response.data?.data;
        if (createdExam) {
          setExams((prev) => [createdExam, ...prev]);
        } else {
          await fetchExams(true);
        }
        setMessage("Exam created successfully.");
      }
      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error(editingExam ? "Failed to update exam:" : "Failed to create exam:", err);
      setError(
        err.response?.data?.message ||
          (editingExam ? "Unable to update the exam." : "Unable to create the exam.")
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Delete exam ─────────────────────────────────────────────────────────────
  const handleDeleteExam = async () => {
    if (!deleteExam?.id) return;
    try {
      setDeleting(true);
      setError("");
      setMessage("");
      await api.delete(`/exams/${deleteExam.id}`);
      setExams((prev) => prev.filter((ex) => ex.id !== deleteExam.id));
      setDeleteExam(null);
      setMessage("Exam deleted successfully.");
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setError(err.response?.data?.message || "Unable to delete the exam.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Field accessors ─────────────────────────────────────────────────────────
  const getExamTitle = (exam) =>
    exam.title || exam.examTitle || exam.name || `Exam #${exam.id}`;

  const getStatus = (exam) => String(exam.status || "DRAFT").toUpperCase();

  const getRegisteredCount = (exam) =>
    exam.registered || exam.registeredCandidates || exam.candidateCount || exam.totalCandidates || 0;

  const getExamDate = (exam) => exam.startTime || exam.scheduledAt || exam.date || "Pending";

  const formatDate = (date) => {
    if (!date || date === "Pending") return "Pending";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return date;
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredExams = exams.filter((exam) => {
    const title = getExamTitle(exam).toLowerCase();
    const description = String(exam.description || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return title.includes(query) || description.includes(query);
  });

  const publishedCount = exams.filter((exam) => {
    const s = getStatus(exam);
    return s === "PUBLISHED" || s === "ACTIVE" || s === "ONGOING";
  }).length;

  const draftCount = exams.filter((exam) => getStatus(exam) === "DRAFT").length;

  // ── Sessions & Grading: fetch sessions for selected exam ───────────────────
  const fetchSessions = useCallback(async (examId) => {
    if (!examId) return;
    try {
      setSessionsLoading(true);
      setSessionsError("");
      setSessions([]);
      const response = await api.get(`/sessions/exam/${examId}`);
      const data = response.data?.data;
      setSessions(extractList(data));
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
      setSessionsError(err.response?.data?.message || "Unable to load sessions for this exam.");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const handleExamSelect = (e) => {
    const id = e.target.value;
    setSelectedExamId(id);
    setResultPanelOpen(false);
    setResult(null);
    setSelectedSession(null);
    fetchSessions(id);
  };

  // ── Sessions & Grading: open result panel ──────────────────────────────────
  const openResultPanel = async (session) => {
    setSelectedSession(session);
    setResultPanelOpen(true);
    setResult(null);
    setResultError("");
    setGradingInFlight({});
    try {
      setResultLoading(true);
      const response = await api.get(`/sessions/${session.id}/result`);
      const data = response.data?.data || response.data;
      setResult(data);
    } catch (err) {
      console.error("Failed to fetch result:", err);
      setResultError(err.response?.data?.message || "Unable to load session result.");
    } finally {
      setResultLoading(false);
    }
  };

  // ── Sessions & Grading: grade an answer ───────────────────────────────────
  const handleGrade = async (answerId, isCorrect) => {
    setGradingInFlight((prev) => ({ ...prev, [answerId]: isCorrect ? "correct" : "incorrect" }));
    try {
      await api.patch(`/answers/${answerId}/grade?isCorrect=${isCorrect}`);
      // Optimistically update the breakdown row
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          breakdown: prev.breakdown.map((row) =>
            row.answerId === answerId || row.questionId === answerId
              ? { ...row, isCorrect }
              : row
          ),
        };
      });
    } catch (err) {
      console.error("Failed to grade answer:", err);
      setResultError(err.response?.data?.message || "Failed to save grade. Please try again.");
    } finally {
      setGradingInFlight((prev) => {
        const next = { ...prev };
        delete next[answerId];
        return next;
      });
    }
  };

  // ── Sessions & Grading: recalculate score ─────────────────────────────────
  const handleRecalculate = async () => {
    if (!selectedSession?.id) return;
    try {
      setRecalculating(true);
      setResultError("");
      const response = await api.patch(`/sessions/${selectedSession.id}/recalculate-score`);
      const updated = response.data?.data || response.data;
      const newScore = updated?.score ?? updated?.totalScore ?? null;
      // Update result panel score
      if (newScore !== null) {
        setResult((prev) => (prev ? { ...prev, score: newScore } : prev));
      }
      // Update sessions list row
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, score: newScore ?? s.score }
            : s
        )
      );
      setSelectedSession((prev) => (prev ? { ...prev, score: newScore ?? prev.score } : prev));
    } catch (err) {
      console.error("Failed to recalculate score:", err);
      setResultError(err.response?.data?.message || "Failed to recalculate score.");
    } finally {
      setRecalculating(false);
    }
  };

  // ── Session field accessors ────────────────────────────────────────────────
  const getStudentName = (session) =>
    session.studentName ||
    session.student?.name ||
    session.student?.username ||
    session.candidateName ||
    `Student #${session.studentId || session.id}`;

  const getSessionStatus = (session) =>
    String(session.status || "UNKNOWN").toUpperCase();

  const getSessionScore = (session) => {
    const s = session.score ?? session.totalScore;
    return s !== undefined && s !== null ? s : "—";
  };

  // ── Breakdown row accessor ─────────────────────────────────────────────────
  // The answer ID for grading may be stored as answerId or id on each breakdown row
  const getAnswerId = (row) => row.answerId ?? row.id ?? row.questionId;

  const needsGrading = (row) =>
    (row.questionType === "CODING" || row.questionType === "DESCRIPTIVE") &&
    row.isCorrect === null || row.isCorrect === undefined;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* ── Sidebar ── */}
      <aside className="w-64 min-h-screen bg-[#0d0f17] border-r border-white/[0.07] flex flex-col justify-between p-4 shrink-0 sticky top-0 h-screen">
        <div>
          <div
            className="p-3 mb-4 cursor-pointer flex items-center gap-3 group"
            onClick={() => navigate("/examiner/dashboard")}
          >
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaClipboardList size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Examiner<span className="text-blue-400">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Faculty Authoring</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
              Workspace
            </p>

            <button
              onClick={() => setActiveTab(TAB_EXAMS)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-xs transition ${
                activeTab === TAB_EXAMS
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <FaClipboardList size={14} />
              <span>My Exams</span>
            </button>

            <button
              onClick={() => setActiveTab(TAB_SESSIONS)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-xs transition ${
                activeTab === TAB_SESSIONS
                  ? "bg-violet-600/15 text-violet-400 border border-violet-500/20 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <FaChalkboardTeacher size={14} />
              <span>Sessions &amp; Grading</span>
            </button>
          </nav>
        </div>

        <div className="pt-3 border-t border-white/[0.07]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-2 rounded-lg transition"
          >
            <FaSignOutAlt size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Faculty Portal
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Examiner Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Create, manage, and monitor your exam papers and student submissions.
            </p>
          </div>

          {activeTab === TAB_EXAMS && (
            <button
              onClick={openCreateModal}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
            >
              <FaPlus size={11} />
              Create New Exam
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 mb-6 bg-[#121520] p-1 rounded-xl border border-white/[0.07] w-fit">
          <button
            onClick={() => setActiveTab(TAB_EXAMS)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === TAB_EXAMS
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaClipboardList size={12} />
            My Exams
          </button>
          <button
            onClick={() => setActiveTab(TAB_SESSIONS)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === TAB_SESSIONS
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaChalkboardTeacher size={12} />
            Sessions &amp; Grading
          </button>
        </div>

        {/* Global Messages (My Exams tab only) */}
        {activeTab === TAB_EXAMS && error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}
        {activeTab === TAB_EXAMS && message && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-emerald-300">{message}</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: My Exams
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === TAB_EXAMS && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
                  <FaClipboardList className="text-blue-400" />
                  Total Exams Created
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
                  {loading ? "..." : exams.length}
                </p>
              </div>

              <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
                  <FaCheckCircle className="text-emerald-400" />
                  Published / Active
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2 font-mono">
                  {loading ? "..." : publishedCount}
                </p>
              </div>

              <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
                  <FaFileAlt className="text-amber-400" />
                  Drafts
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono">
                  {loading ? "..." : draftCount}
                </p>
              </div>
            </div>

            {/* Search + Table */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 w-full sm:w-80">
                  <FaSearch className="text-slate-500 text-xs mr-2.5" />
                  <input
                    type="text"
                    placeholder="Search your exams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Showing:{" "}
                  <span className="font-semibold text-white">{filteredExams.length} exams</span>
                </div>
              </div>

              {loading ? (
                <div className="py-14 text-center">
                  <div className="w-9 h-9 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-xs text-slate-400">Loading your exams...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-3 px-3">Exam Title</th>
                        <th className="pb-3 px-3">Status</th>
                        <th className="pb-3 px-3">Registered Candidates</th>
                        <th className="pb-3 px-3">Start Time</th>
                        <th className="pb-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04] text-xs">
                      {filteredExams.length > 0 ? (
                        filteredExams.map((exam) => {
                          const status = getStatus(exam);
                          const isPublished =
                            status === "PUBLISHED" || status === "ACTIVE" || status === "ONGOING";
                          return (
                            <tr key={exam.id} className="hover:bg-white/[0.02] transition">
                              <td className="py-3.5 px-3">
                                <p className="font-semibold text-white">{getExamTitle(exam)}</p>
                                {exam.description && (
                                  <p className="text-slate-500 text-[11px] mt-1 max-w-md truncate">
                                    {exam.description}
                                  </p>
                                )}
                              </td>
                              <td className="py-3.5 px-3">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                    isPublished
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  }`}
                                >
                                  {status}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-slate-300 font-mono">
                                {getRegisteredCount(exam)} candidates
                              </td>
                              <td className="py-3.5 px-3 text-slate-400 font-mono">
                                {formatDate(getExamDate(exam))}
                              </td>
                              <td className="py-3.5 px-3">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openQuestionBank(exam)}
                                    title="Manage Questions"
                                    className="h-8 px-3 rounded-lg flex items-center justify-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                                  >
                                    <FaQuestionCircle size={12} />
                                    <span className="hidden xl:inline">Questions</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(exam)}
                                    title="Edit Exam"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
                                  >
                                    <FaEdit size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setError("");
                                      setMessage("");
                                      setDeleteExam(exam);
                                    }}
                                    title="Delete Exam"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
                                  >
                                    <FaTrash size={12} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-10 text-center text-slate-500 text-xs">
                            {searchQuery
                              ? "No exams found matching your search."
                              : "No exams have been created yet."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TAB: Sessions & Grading
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === TAB_SESSIONS && (
          <div className="flex gap-6 relative">
            {/* Left Column: exam selector + sessions table */}
            <div className={`flex-1 min-w-0 transition-all ${resultPanelOpen ? "max-w-[55%]" : ""}`}>
              {/* Exam Selector */}
              <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm mb-5">
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  Select Exam
                </label>
                {loading ? (
                  <div className="h-9 bg-[#090a0f] border border-white/[0.08] rounded-lg animate-pulse" />
                ) : (
                  <select
                    value={selectedExamId}
                    onChange={handleExamSelect}
                    className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 transition appearance-none cursor-pointer"
                  >
                    <option value="">— Choose an exam to view sessions —</option>
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {getExamTitle(exam)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Sessions Table */}
              {selectedExamId && (
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-white">
                      Exam Sessions
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">
                      {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {sessionsError && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                      <p className="text-xs text-red-300">{sessionsError}</p>
                    </div>
                  )}

                  {sessionsLoading ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-slate-400">Loading sessions...</p>
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="py-10 text-center text-slate-500 text-xs">
                      No sessions found for this exam.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                          <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="pb-3 px-3">Student</th>
                            <th className="pb-3 px-3">Attempt</th>
                            <th className="pb-3 px-3">Status</th>
                            <th className="pb-3 px-3">Score</th>
                            <th className="pb-3 px-3">Start Time</th>
                            <th className="pb-3 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04] text-xs">
                          {sessions.map((session) => {
                            const sStatus = getSessionStatus(session);
                            const isActive = sStatus === "IN_PROGRESS" || sStatus === "ACTIVE";
                            const isCompleted = sStatus === "COMPLETED" || sStatus === "SUBMITTED" || sStatus === "FINISHED";
                            return (
                              <tr
                                key={session.id}
                                className={`hover:bg-white/[0.02] transition ${
                                  selectedSession?.id === session.id ? "bg-violet-500/5" : ""
                                }`}
                              >
                                <td className="py-3.5 px-3 font-medium text-white">
                                  {getStudentName(session)}
                                </td>
                                <td className="py-3.5 px-3 text-slate-400 font-mono">
                                  #{session.attemptNumber ?? 1}
                                </td>
                                <td className="py-3.5 px-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                                      isCompleted
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                        : isActive
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                    }`}
                                  >
                                    {sStatus}
                                  </span>
                                </td>
                                <td className="py-3.5 px-3 text-slate-300 font-mono">
                                  {getSessionScore(session)}
                                </td>
                                <td className="py-3.5 px-3 text-slate-400 font-mono">
                                  {formatDate(session.startTime || session.startedAt)}
                                </td>
                                <td className="py-3.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => openResultPanel(session)}
                                    className="h-8 px-3 rounded-lg flex items-center justify-end gap-1.5 text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition ml-auto"
                                  >
                                    <span>View Results</span>
                                    <FaChevronRight size={10} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {!selectedExamId && !loading && (
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-10 text-center shadow-sm">
                  <FaChalkboardTeacher className="text-4xl text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">Select an exam above to view its sessions.</p>
                  <p className="text-xs text-slate-600 mt-1">You can then review student results and grade answers.</p>
                </div>
              )}
            </div>

            {/* ── Result Side Panel ── */}
            {resultPanelOpen && (
              <div className="w-[45%] shrink-0 bg-[#121520] border border-white/[0.07] rounded-xl shadow-lg flex flex-col h-fit sticky top-6">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                  <div>
                    <h3 className="text-sm font-bold text-white">Result Breakdown</h3>
                    {selectedSession && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {getStudentName(selectedSession)} — Attempt #{selectedSession.attemptNumber ?? 1}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResultPanelOpen(false);
                      setResult(null);
                      setSelectedSession(null);
                      setResultError("");
                    }}
                    className="text-slate-400 hover:text-white p-1 transition"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Panel Body */}
                <div className="p-5 overflow-y-auto max-h-[calc(100vh-14rem)]">
                  {resultError && (
                    <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                      <p className="text-xs text-red-300">{resultError}</p>
                    </div>
                  )}

                  {resultLoading ? (
                    <div className="py-12 text-center">
                      <div className="w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-slate-400">Loading result...</p>
                    </div>
                  ) : result ? (
                    <>
                      {/* Score Summary */}
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-[#090a0f] border border-white/[0.07] rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Score</p>
                          <p className="text-lg font-bold text-white font-mono">
                            {result.score ?? "—"}<span className="text-slate-500 text-xs">/{result.totalMarks ?? "?"}</span>
                          </p>
                        </div>
                        <div className="bg-[#090a0f] border border-white/[0.07] rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Percentage</p>
                          <p className="text-lg font-bold text-violet-400 font-mono">
                            {result.percentage !== undefined && result.percentage !== null
                              ? `${Number(result.percentage).toFixed(1)}%`
                              : "—"}
                          </p>
                        </div>
                        <div className="bg-[#090a0f] border border-white/[0.07] rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Grade</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {result.grade ?? "—"}
                          </p>
                        </div>
                      </div>

                      {/* Breakdown Table */}
                      {result.breakdown && result.breakdown.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Question Breakdown
                          </h4>
                          {result.breakdown.map((row, idx) => {
                            const answerId = getAnswerId(row);
                            const requiresGrading = needsGrading(row);
                            const inFlight = gradingInFlight[answerId];
                            return (
                              <div
                                key={answerId ?? idx}
                                className="bg-[#090a0f] border border-white/[0.07] rounded-lg p-3.5 space-y-2"
                              >
                                {/* Question header */}
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs text-white font-medium leading-snug flex-1">
                                    <span className="text-slate-500 mr-1.5">Q{idx + 1}.</span>
                                    {row.questionText || `Question #${row.questionId}`}
                                  </p>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-700/40 text-slate-400 border-slate-600/40">
                                      {row.questionType}
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {row.marks ?? 0} pts
                                    </span>
                                  </div>
                                </div>

                                {/* Student Answer */}
                                {(row.selectedOption || row.textAnswer) && (
                                  <div className="bg-white/[0.03] border border-white/[0.05] rounded px-3 py-2">
                                    <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider">
                                      Student Answer
                                    </p>
                                    <p className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                                      {row.selectedOption || row.textAnswer}
                                    </p>
                                  </div>
                                )}

                                {/* Grade status / buttons */}
                                <div className="flex items-center justify-between gap-2">
                                  {/* Current grade badge */}
                                  {row.isCorrect === true && (
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                                      ✓ Correct
                                    </span>
                                  )}
                                  {row.isCorrect === false && (
                                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                                      ✗ Incorrect
                                    </span>
                                  )}
                                  {(row.isCorrect === null || row.isCorrect === undefined) &&
                                    !requiresGrading && (
                                      <span className="text-[10px] text-slate-600">—</span>
                                    )}
                                  {/* Grade buttons for CODING / DESCRIPTIVE with null isCorrect */}
                                  {requiresGrading && (
                                    <div className="flex items-center gap-1.5 ml-auto">
                                      <button
                                        type="button"
                                        disabled={!!inFlight}
                                        onClick={() => handleGrade(answerId, true)}
                                        className="h-7 px-2.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                      >
                                        {inFlight === "correct" ? "Saving..." : "✓ Correct"}
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!!inFlight}
                                        onClick={() => handleGrade(answerId, false)}
                                        className="h-7 px-2.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                      >
                                        {inFlight === "incorrect" ? "Saving..." : "✗ Incorrect"}
                                      </button>
                                    </div>
                                  )}
                                  {/* Already graded — allow re-grade */}
                                  {(row.isCorrect === true || row.isCorrect === false) &&
                                    (row.questionType === "CODING" || row.questionType === "DESCRIPTIVE") && (
                                      <div className="flex items-center gap-1.5 ml-auto">
                                        <button
                                          type="button"
                                          disabled={!!inFlight}
                                          onClick={() => handleGrade(answerId, !row.isCorrect)}
                                          className="h-7 px-2.5 rounded-md text-[10px] font-medium text-slate-400 border border-white/[0.08] hover:bg-white/[0.04] disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                          {inFlight ? "Saving..." : "Change Grade"}
                                        </button>
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-6">No question breakdown available.</p>
                      )}

                      {/* Recalculate Score Button */}
                      <div className="mt-5 pt-4 border-t border-white/[0.07]">
                        <button
                          type="button"
                          onClick={handleRecalculate}
                          disabled={recalculating}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition active:scale-[0.98]"
                        >
                          <FaCalculator size={12} />
                          {recalculating ? "Recalculating..." : "Recalculate Score"}
                        </button>
                        <p className="text-[10px] text-slate-600 text-center mt-2">
                          Run this after grading all answers to update the final score.
                        </p>
                      </div>
                    </>
                  ) : (
                    !resultError && (
                      <p className="text-xs text-slate-500 text-center py-8">No result data.</p>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Create / Edit Exam Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingExam ? "Edit Exam Paper" : "Create New Exam Paper"}
              </h3>
              <button
                type="button"
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form onSubmit={handleExamSubmit} className="space-y-3.5 text-xs">
              {/* Title */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Exam Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Networks Mid-Term"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  placeholder="Enter exam description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Duration (minutes) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 60"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">Start Time *</label>
                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">End Time *</label>
                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 bg-[#090a0f] hover:bg-white/[0.04] text-slate-300 rounded-lg font-medium border border-white/[0.08] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition active:scale-[0.98] shadow-sm"
                >
                  {creating
                    ? editingExam ? "Updating..." : "Creating..."
                    : editingExam ? "Update Exam" : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteExam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Delete Exam?</h3>
                <p className="text-xs text-slate-400 mt-1">This action cannot be undone.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteExam(null)}
                disabled={deleting}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="rounded-lg bg-rose-500/5 border border-rose-500/15 p-3 mb-5">
              <p className="text-xs text-slate-300">You are about to delete:</p>
              <p className="text-sm font-semibold text-white mt-1">{getExamTitle(deleteExam)}</p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteExam(null)}
                disabled={deleting}
                className="px-4 py-2 bg-[#090a0f] hover:bg-white/[0.04] text-slate-300 rounded-lg font-medium border border-white/[0.08] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExam}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {deleting ? "Deleting..." : "Delete Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
