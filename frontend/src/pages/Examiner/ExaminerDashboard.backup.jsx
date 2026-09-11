import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

export default function ExaminerDashboard() {
  const navigate = useNavigate();

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

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/exams");

        const data = response.data?.data;

        const examList = Array.isArray(data)
          ? data
          : data?.content || data?.exams || [];

        setExams(examList);
      } catch (err) {
        console.error("Failed to fetch exams:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your exams."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // Logout
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

  // Reset form
  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDuration("");
    setNewStartTime("");
    setNewEndTime("");
    setEditingExam(null);
  };

  // Convert backend LocalDateTime into datetime-local format
  const formatDateTimeForInput = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 16);
    }

    const pad = (number) => String(number).padStart(2, "0");

    return `${date.getFullYear()}-${pad(
      date.getMonth() + 1
    )}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  // Open create modal
  const openCreateModal = () => {
    resetForm();
    setError("");
    setMessage("");
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (exam) => {
    setError("");
    setMessage("");

    setEditingExam(exam);

    setNewTitle(exam.title || "");
    setNewDescription(exam.description || "");
    setNewDuration(
      exam.durationMinutes !== undefined &&
        exam.durationMinutes !== null
        ? String(exam.durationMinutes)
        : ""
    );

    setNewStartTime(
      formatDateTimeForInput(exam.startTime)
    );

    setNewEndTime(
      formatDateTimeForInput(exam.endTime)
    );

    setIsModalOpen(true);
  };

  // Create / Update exam
  const handleExamSubmit = async (e) => {
    e.preventDefault();

    if (
      !newTitle.trim() ||
      !newDuration ||
      !newStartTime ||
      !newEndTime
    ) {
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
        // PUT /api/exams/{id}
        response = await api.put(
          `/exams/${editingExam.id}`,
          payload
        );

        const updatedExam = response.data?.data;

        if (updatedExam) {
          setExams((prev) =>
            prev.map((exam) =>
              exam.id === editingExam.id
                ? updatedExam
                : exam
            )
          );
        } else {
          const refreshResponse = await api.get("/exams");
          const data = refreshResponse.data?.data;

          const examList = Array.isArray(data)
            ? data
            : data?.content || data?.exams || [];

          setExams(examList);
        }

        setMessage("Exam updated successfully.");
      } else {
        // POST /api/exams
        response = await api.post("/exams", payload);

        const createdExam = response.data?.data;

        if (createdExam) {
          setExams((prev) => [createdExam, ...prev]);
        } else {
          const refreshResponse = await api.get("/exams");
          const data = refreshResponse.data?.data;

          const examList = Array.isArray(data)
            ? data
            : data?.content || data?.exams || [];

          setExams(examList);
        }

        setMessage("Exam created successfully.");
      }

      resetForm();
      setIsModalOpen(false);
    } catch (err) {
      console.error(
        editingExam
          ? "Failed to update exam:"
          : "Failed to create exam:",
        err
      );

      setError(
        err.response?.data?.message ||
          (editingExam
            ? "Unable to update the exam."
            : "Unable to create the exam.")
      );
    } finally {
      setCreating(false);
    }
  };

  // Delete exam
  const handleDeleteExam = async () => {
    if (!deleteExam?.id) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      // DELETE /api/exams/{id}
      await api.delete(`/exams/${deleteExam.id}`);

      setExams((prev) =>
        prev.filter((exam) => exam.id !== deleteExam.id)
      );

      setDeleteExam(null);
      setMessage("Exam deleted successfully.");
    } catch (err) {
      console.error("Failed to delete exam:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete the exam."
      );
    } finally {
      setDeleting(false);
    }
  };

  // Backend fields
  const getExamTitle = (exam) =>
    exam.title ||
    exam.examTitle ||
    exam.name ||
    `Exam #${exam.id}`;

  const getStatus = (exam) => {
    const status = exam.status || "DRAFT";

    return String(status).toUpperCase();
  };

  const getRegisteredCount = (exam) =>
    exam.registered ||
    exam.registeredCandidates ||
    exam.candidateCount ||
    exam.totalCandidates ||
    0;

  const getExamDate = (exam) =>
    exam.startTime ||
    exam.scheduledAt ||
    exam.date ||
    "Pending";

  const formatDate = (date) => {
    if (!date || date === "Pending") {
      return "Pending";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

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

    const description = String(
      exam.description || ""
    ).toLowerCase();

    const query = searchQuery.toLowerCase();

    return (
      title.includes(query) ||
      description.includes(query)
    );
  });

  const publishedCount = exams.filter((exam) => {
    const status = getStatus(exam);

    return (
      status === "PUBLISHED" ||
      status === "ACTIVE" ||
      status === "ONGOING"
    );
  }).length;

  const draftCount = exams.filter(
    (exam) => getStatus(exam) === "DRAFT"
  ).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* Sidebar */}
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

              <p className="text-[11px] text-slate-400 font-medium">
                Faculty Authoring
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
              Workspace
            </p>

            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold text-xs shadow-sm">
              <FaClipboardList size={14} />
              <span>My Exams</span>
            </div>
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

      {/* Main Content */}
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
              Create, manage, and monitor your exam papers and student
              submissions.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
          >
            <FaPlus size={11} />
            Create New Exam
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-emerald-300">{message}</p>
          </div>
        )}

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
              <span className="font-semibold text-white">
                {filteredExams.length} exams
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <div className="w-9 h-9 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-xs text-slate-400">
                Loading your exams...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Exam Title</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">
                      Registered Candidates
                    </th>
                    <th className="pb-3 px-3">Start Time</th>
                    <th className="pb-3 px-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => {
                      const status = getStatus(exam);

                      const isPublished =
                        status === "PUBLISHED" ||
                        status === "ACTIVE" ||
                        status === "ONGOING";

                      return (
                        <tr
                          key={exam.id}
                          className="hover:bg-white/[0.02] transition"
                        >
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-white">
                              {getExamTitle(exam)}
                            </p>

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
                                onClick={() =>
                                  openEditModal(exam)
                                }
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
                      <td
                        colSpan="5"
                        className="py-10 text-center text-slate-500 text-xs"
                      >
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
      </main>

      {/* Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white tracking-tight">
                {editingExam
                  ? "Edit Exam Paper"
                  : "Create New Exam Paper"}
              </h3>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={handleExamSubmit}
              className="space-y-3.5 text-xs"
            >
              {/* Title */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Exam Title *
                </label>

                <input
                  type="text"
                  placeholder="e.g., Computer Networks Mid-Term"
                  value={newTitle}
                  onChange={(e) =>
                    setNewTitle(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Description
                </label>

                <textarea
                  placeholder="Enter exam description..."
                  value={newDescription}
                  onChange={(e) =>
                    setNewDescription(e.target.value)
                  }
                  rows="3"
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Duration (minutes) *
                </label>

                <input
                  type="number"
                  min="1"
                  placeholder="e.g., 60"
                  value={newDuration}
                  onChange={(e) =>
                    setNewDuration(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Start Time *
                </label>

                <input
                  type="datetime-local"
                  value={newStartTime}
                  onChange={(e) =>
                    setNewStartTime(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  End Time *
                </label>

                <input
                  type="datetime-local"
                  value={newEndTime}
                  onChange={(e) =>
                    setNewEndTime(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
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
                    ? editingExam
                      ? "Updating..."
                      : "Creating..."
                    : editingExam
                    ? "Update Exam"
                    : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteExam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">
                  Delete Exam?
                </h3>

                <p className="text-xs text-slate-400 mt-1">
                  This action cannot be undone.
                </p>
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
              <p className="text-xs text-slate-300">
                You are about to delete:
              </p>

              <p className="text-sm font-semibold text-white mt-1">
                {getExamTitle(deleteExam)}
              </p>
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

