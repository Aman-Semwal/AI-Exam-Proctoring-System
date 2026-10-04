import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaFileAlt,
  FaSearch,
  FaRedo,
  FaEye,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";
import api from "../../services/api";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";

const SuperAdminExams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Detail modal
  const [detailExam, setDetailExam] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  /* ===================== Helpers ===================== */

  const getList = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.exams)) return data.exams;

    return [];
  };

  const formatDuration = (duration) => {
    if (duration === null || duration === undefined || duration === "") {
      return "—";
    }

    const value = Number(duration);

    if (Number.isNaN(value)) {
      return String(duration);
    }

    return `${value} mins`;
  };

  const getStatus = (exam) => {
    const rawStatus = String(exam?.status || "").toUpperCase();

    if (
      rawStatus === "ACTIVE" ||
      rawStatus === "ONGOING" ||
      rawStatus === "LIVE" ||
      rawStatus === "IN_PROGRESS"
    ) {
      return "Live";
    }

    if (
      rawStatus === "COMPLETED" ||
      rawStatus === "FINISHED" ||
      rawStatus === "CLOSED"
    ) {
      return "Completed";
    }

    if (
      rawStatus === "CANCELLED" ||
      rawStatus === "CANCELED"
    ) {
      return "Cancelled";
    }

    return "Scheduled";
  };

  /* ===================== Fetch exams ===================== */

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/exams");
      const examList = getList(response);

      setExams(examList);
    } catch (err) {
      console.error("Failed to fetch exams:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load examinations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  /* ===================== Normalize exams ===================== */

  const normalizedExams = useMemo(() => {
    return exams.map((exam) => ({
      id: exam.id,
      title:
        exam.title ||
        exam.name ||
        exam.examTitle ||
        "Untitled Exam",

      code:
        exam.code ||
        exam.examCode ||
        exam.courseCode ||
        "—",

      org:
        exam.organizationName ||
        exam.orgName ||
        exam.organization?.name ||
        exam.org?.name ||
        exam.orgSlug ||
        "—",

      duration: formatDuration(
        exam.durationMinutes ??
          exam.duration ??
          exam.durationInMinutes
      ),

      description: exam.description || "No description available.",

      scheduledAt: exam.scheduledAt || exam.scheduled_at || null,

      createdByName:
        exam.createdByName ||
        exam.creatorName ||
        exam.createdBy?.name ||
        "—",

      status: getStatus(exam),
    }));
  }, [exams]);

  /* ===================== Filter ===================== */

  const filtered = normalizedExams.filter(
    (exam) =>
      exam.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      exam.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      exam.org
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /* ===================== View Details ===================== */

  const handleViewDetails = async (exam) => {
    try {
      setDetailLoading(true);
      setDetailExam(exam);

      const response = await api.get(`/exams/${exam.id}`);
      const data = response.data?.data ?? response.data;

      setDetailExam({
        ...exam,
        description: data.description || exam.description,
        scheduledAt: data.scheduledAt || exam.scheduledAt,
        createdByName: data.createdByName || exam.createdByName,
        durationMinutes:
          data.durationMinutes ?? data.duration ?? exam.duration,
      });
    } catch {
      // Keep existing data
    } finally {
      setDetailLoading(false);
    }
  };

  /* ===================== Delete Exam ===================== */

  const handleDeleteExam = async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);

      await api.delete(`/exams/${deleteTarget.id}`);

      setDeleteTarget(null);
      setToast({ message: "Exam deleted successfully.", type: "success" });
      fetchExams();
    } catch (err) {
      console.error("Failed to delete exam:", err);
      setToast({
        message:
          err.response?.data?.message || "Failed to delete exam.",
        type: "error",
      });
      setDeleteTarget(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ===================== Render ===================== */

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/6">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Examinations
            </span>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Platform Examinations
            </h1>

            <p className="text-slate-400 mt-1 text-xs sm:text-sm">
              Oversee all active, scheduled, and completed assessments across
              organizations.
            </p>
          </div>

          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search exams by title, code or org..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/8 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Total: {filtered.length} Examinations
                </span>

                <button
                  onClick={fetchExams}
                  disabled={loading}
                  className="p-2 rounded-lg border border-white/8 text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-50"
                  title="Refresh"
                >
                  <FaRedo
                    size={11}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Loading examinations...
                </p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-rose-400 mb-4">
                  {error}
                </p>

                <button
                  onClick={fetchExams}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FaFileAlt
                  className="mx-auto text-slate-600 mb-3"
                  size={24}
                />

                <p className="text-sm text-slate-400">
                  {searchTerm
                    ? "No examinations match your search."
                    : "No examinations found."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-187.5 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/6 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-3">
                        Exam Title
                      </th>

                      <th className="pb-3 px-3">
                        Code
                      </th>

                      <th className="pb-3 px-3">
                        Organization
                      </th>

                      <th className="pb-3 px-3">
                        Duration
                      </th>

                      <th className="pb-3 px-3">
                        Status
                      </th>

                      <th className="pb-3 px-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/4 text-xs">
                    {filtered.map((exam) => (
                      <tr
                        key={exam.id}
                        className="hover:bg-white/2 transition"
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                              <FaFileAlt size={11} />
                            </div>

                            <span>
                              {exam.title}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-purple-400">
                          {exam.code}
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          {exam.org}
                        </td>

                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {exam.duration}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              exam.status === "Live"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : exam.status === "Scheduled"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : exam.status === "Cancelled"
                                ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {exam.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <ActionDropdown
                            actions={[
                              {
                                label: "View Details",
                                icon: FaEye,
                                onClick: () => handleViewDetails(exam),
                              },
                              {
                                label: "Delete Exam",
                                icon: FaTrashAlt,
                                danger: true,
                                onClick: () => setDeleteTarget(exam),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* =============== Exam Detail Modal =============== */}
      {detailExam && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailExam(null);
          }}
        >
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center">
                  <FaFileAlt size={14} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    {detailExam.title}
                  </h2>
                  <p className="text-[10px] text-purple-400 font-mono">
                    {detailExam.code}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailExam(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="w-3 h-3 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  Fetching latest details...
                </div>
              )}

              <DetailRow label="ID" value={detailExam.id} />
              <DetailRow label="Title" value={detailExam.title} />
              <DetailRow label="Code" value={detailExam.code} mono />
              <DetailRow label="Organization" value={detailExam.org} />
              <DetailRow label="Duration" value={detailExam.duration} />
              <DetailRow label="Status" value={detailExam.status} status />
              <DetailRow label="Created By" value={detailExam.createdByName} />

              {detailExam.scheduledAt && (
                <DetailRow
                  label="Scheduled At"
                  value={new Date(detailExam.scheduledAt).toLocaleString()}
                />
              )}

              {detailExam.description && detailExam.description !== "—" && (
                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">
                    Description
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed bg-[#090a0f] border border-white/6 rounded-lg p-3">
                    {detailExam.description}
                  </p>
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setDetailExam(null)}
                className="w-full py-2.5 rounded-lg border border-white/8 bg-[#090a0f] text-xs text-slate-300 font-semibold hover:text-white hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== Delete Confirm =============== */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Examination"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This will permanently remove the exam and all associated data. This action cannot be undone.`}
        confirmLabel="Delete Exam"
        loading={deleteLoading}
        onConfirm={handleDeleteExam}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

/* ===================== Detail Row Subcomponent ===================== */

const DetailRow = ({ label, value, mono, status }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/4 last:border-none">
    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
      {label}
    </span>

    {status ? (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
          value === "Live"
            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
            : value === "Scheduled"
            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
            : value === "Cancelled"
            ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}
      >
        {value}
      </span>
    ) : (
      <span
        className={`text-xs text-white ${mono ? "font-mono text-purple-400" : ""}`}
      >
        {value ?? "—"}
      </span>
    )}
  </div>
);

export default SuperAdminExams;
