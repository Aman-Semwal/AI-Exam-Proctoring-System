import { useCallback, useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaEye,
  FaTrash,
  FaUserTie,
  FaFileUpload,
  FaFileDownload,
  FaSpinner,
  FaHistory,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import api from "../../services/api";

export default function Examiners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examiners, setExaminers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Bulk Import
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkActiveJob, setBulkActiveJob] = useState(null);
  const [bulkTab, setBulkTab] = useState("upload");
  const [bulkHistory, setBulkHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [detailExaminer, setDetailExaminer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const [newExaminer, setNewExaminer] = useState({
    name: "",
    email: "",
  });

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const getOrgId = () => currentUser?.orgId;

  const fetchExaminers = useCallback(async () => {
    const orgId = getOrgId();

    if (!orgId) {
      setError("Organization ID not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/organizations/${orgId}/members`);

      const data = response?.data?.data ?? response?.data ?? [];

      const members = Array.isArray(data)
        ? data
        : Array.isArray(data?.members)
        ? data.members
        : [];

      const examinerMembers = members.filter(
        (member) =>
          String(member?.role || "").toUpperCase() === "EXAM_CREATOR"
      );

      setExaminers(examinerMembers);
    } catch (err) {
      console.error("Failed to fetch examiners:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load examiners. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchExaminers();
  }, [fetchExaminers]);

  const filteredExaminers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return examiners;

    return examiners.filter((examiner) => {
      const name = String(examiner?.name || "").toLowerCase();
      const email = String(examiner?.email || "").toLowerCase();

      const department = String(
        examiner?.department ||
          examiner?.dept ||
          examiner?.departmentName ||
          ""
      ).toLowerCase();

      return (
        name.includes(query) ||
        email.includes(query) ||
        department.includes(query)
      );
    });
  }, [examiners, searchQuery]);

  const handleAddExaminer = async (e) => {
    e.preventDefault();

    const orgId = getOrgId();

    if (!orgId) {
      setToast({ type: "error", message: "Organization ID not found. Please login again." });
      return;
    }

    if (!newExaminer.name.trim() || !newExaminer.email.trim()) {
      setToast({ type: "error", message: "Name and email are required." });
      return;
    }

    try {
      setAdding(true);

      await api.post(`/organizations/${orgId}/members`, {
        name: newExaminer.name.trim(),
        email: newExaminer.email.trim(),
        role: "EXAM_CREATOR",
      });

      setToast({
        type: "success",
        message: `Examiner "${newExaminer.name}" added successfully.`,
      });

      setNewExaminer({
        name: "",
        email: "",
      });

      setShowAddModal(false);
      await fetchExaminers();
    } catch (err) {
      console.error("Failed to add examiner:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Unable to add examiner. Please try again.",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveExaminer = async () => {
    const orgId = getOrgId();

    if (!orgId || !deleteTarget?.id) {
      setToast({ type: "error", message: "Examiner information is incomplete." });
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `/organizations/${orgId}/members/${deleteTarget.id}`
      );

      setToast({
        type: "success",
        message: `Examiner "${deleteTarget.name || "Examiner"}" removed successfully.`,
      });

      setDeleteTarget(null);
      await fetchExaminers();
    } catch (err) {
      console.error("Failed to remove examiner:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Unable to remove examiner. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  /* ================= BULK IMPORT HELPERS ================= */

  const handleDownloadTemplate = () => {
    const headers = "name,email,role,department,designation";
    const sampleRows = [
      "Dr. Vikram Singh,vikram.singh@example.com,EXAM_CREATOR,Computer Science,Associate Professor",
      "Prof. Ananya Roy,ananya.roy@example.com,EXAM_CREATOR,Information Technology,Professor",
    ].join("\n");
    const blob = new Blob([`${headers}\n${sampleRows}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "examiners_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchBulkHistory = async () => {
    const orgId = getOrgId();
    if (!orgId) return;
    try {
      setLoadingHistory(true);
      const res = await api.get(`/orgs/${orgId}/bulk-import`);
      const data = res.data?.data ?? res.data ?? [];
      setBulkHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load bulk import history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const pollJobStatus = async (jobId, orgId) => {
    let attempts = 0;
    const maxAttempts = 30;

    const interval = setInterval(async () => {
      attempts += 1;
      try {
        const res = await api.get(`/orgs/${orgId}/bulk-import/${jobId}`);
        const job = res.data?.data ?? res.data;
        if (job) {
          setBulkActiveJob(job);
          if (job.status === "COMPLETED" || job.status === "FAILED" || attempts >= maxAttempts) {
            clearInterval(interval);
            setUploadingBulk(false);
            if (job.status === "COMPLETED") {
              setToast({
                type: "success",
                message: `Import completed: ${job.successCount || 0} examiners added (${job.failedCount || 0} failed).`,
              });
              await fetchExaminers();
            } else if (job.status === "FAILED") {
              setToast({
                type: "error",
                message: "Bulk import job failed. Inspect row errors below.",
              });
            }
          }
        }
      } catch (pollErr) {
        console.warn("Poll status check failed:", pollErr);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setUploadingBulk(false);
        }
      }
    }, 1200);
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();

    if (!bulkFile) {
      setToast({ type: "error", message: "Please select a CSV or Excel file." });
      return;
    }

    try {
      setUploadingBulk(true);
      setBulkActiveJob({ status: "PENDING", totalRows: 0, successCount: 0, failedCount: 0, errors: [] });
      const orgId = getOrgId();

      if (!orgId) throw new Error("Organization ID not found.");

      const formData = new FormData();
      formData.append("file", bulkFile);

      const res = await api.post(`/orgs/${orgId}/bulk-import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const jobId = res.data?.data?.jobId;
      if (jobId) {
        setBulkActiveJob((prev) => ({ ...prev, jobId, status: "PROCESSING" }));
        pollJobStatus(jobId, orgId);
      } else {
        setToast({
          type: "success",
          message: "Bulk import job accepted and queued.",
        });
        setUploadingBulk(false);
        setTimeout(fetchExaminers, 2000);
      }
    } catch (err) {
      console.error("Bulk import error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Bulk import failed.",
      });
      setUploadingBulk(false);
      setBulkActiveJob(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <OrganizationSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Faculty
            </span>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Examiners Management
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage faculty members and exam paper creators for your organization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkModal(true)}
              className="bg-white/[0.05] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] px-3.5 py-2.5 rounded-lg font-semibold text-xs transition active:scale-[0.98] flex items-center gap-1.5"
            >
              <FaFileUpload size={11} className="text-blue-400" />
              Bulk Import
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
            >
              <FaPlus size={11} />
              Add New Examiner
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-4 py-3 text-xs flex items-center justify-between gap-3">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-300"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}

        {/* Search & Stats */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

              <input
                type="text"
                placeholder="Search examiners by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Total Examiners:{" "}
              <span className="font-semibold text-white">
                {filteredExaminers.length}
              </span>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading examiners...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Examiner</th>
                    <th className="pb-3 px-3">Department / Track</th>
                    <th className="pb-3 px-3">Active Exams</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredExaminers.length > 0 ? (
                    filteredExaminers.map((examiner) => (
                      <ExaminerRow
                        key={examiner.id}
                        examiner={examiner}
                        onView={() => setDetailExaminer(examiner)}
                        onRemove={() => setDeleteTarget(examiner)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-slate-500 text-xs"
                      >
                        {searchQuery
                          ? "No examiners found matching your search."
                          : "No examiners found for this organization."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Examiner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Add New Examiner
                </h2>

                <p className="text-[11px] text-slate-500 mt-1">
                  Add a faculty member as an exam creator.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05]"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleAddExaminer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Full Name *
                </label>

                <input
                  type="text"
                  required
                  value={newExaminer.name}
                  onChange={(e) =>
                    setNewExaminer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Dr. Robert Vance"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Email Address *
                </label>

                <input
                  type="email"
                  required
                  value={newExaminer.email}
                  onChange={(e) =>
                    setNewExaminer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="examiner@college.edu"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg font-medium text-slate-300 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Examiner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Examiner Details Modal */}
      {detailExaminer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.1] rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.07]">
              <h3 className="text-base font-bold text-white">Examiner Profile</h3>
              <button
                type="button"
                onClick={() => setDetailExaminer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                  {(detailExaminer.name || "EX").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{detailExaminer.name || "Faculty"}</p>
                  <p className="text-slate-400 text-[11px]">{detailExaminer.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Role</span>
                  <p className="font-semibold text-blue-400 mt-1">EXAM_CREATOR</p>
                </div>
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Status</span>
                  <p className="font-semibold text-emerald-400 mt-1">
                    {detailExaminer.status || (detailExaminer.active === false ? "Inactive" : "Active")}
                  </p>
                </div>
              </div>

              <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                <span className="text-slate-500 block">Department</span>
                <p className="text-slate-200 mt-1">
                  {detailExaminer.department || detailExaminer.dept || detailExaminer.departmentName || "General Faculty"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailExaminer(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FaFileUpload className="text-blue-400" size={14} />
                  Bulk Import Examiners
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Import examiner and faculty records from CSV/XLSX.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkActiveJob(null);
                  setBulkFile(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/[0.06] mb-4 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBulkTab("upload")}
                className={`pb-2.5 border-b-2 transition ${
                  bulkTab === "upload"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkTab("history");
                  fetchBulkHistory();
                }}
                className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
                  bulkTab === "history"
                    ? "border-blue-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <FaHistory size={11} />
                Recent Imports
              </button>
            </div>

            {bulkTab === "upload" ? (
              <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
                {/* Download Template Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-[11px]">
                    <span className="text-slate-300 font-medium block">Need the exact CSV format?</span>
                    <span className="text-slate-500">Columns: name, email, role (EXAM_CREATOR), department</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-semibold text-[11px] border border-blue-500/30 transition shrink-0"
                  >
                    <FaFileDownload size={11} />
                    Download CSV
                  </button>
                </div>

                {/* Upload Box */}
                <div className="p-4 rounded-xl border border-dashed border-white/[0.15] bg-[#090a0f] text-center">
                  <FaFileUpload size={24} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-slate-200 font-medium">
                    {bulkFile ? bulkFile.name : "Choose CSV or XLSX file to upload"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts .csv and .xlsx spreadsheets
                  </p>

                  <input
                    type="file"
                    id="bulk-examiner-file-input"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => {
                      setBulkFile(e.target.files[0] || null);
                      setBulkActiveJob(null);
                    }}
                    className="hidden"
                  />

                  <label
                    htmlFor="bulk-examiner-file-input"
                    className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-blue-400 font-semibold cursor-pointer transition"
                  >
                    {bulkFile ? "Change File" : "Browse Computer"}
                  </label>
                </div>

                {/* Live Processing Card & Row Error Report */}
                {bulkActiveJob && (
                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#090a0f] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-slate-300">
                        Job Status:
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          bulkActiveJob.status === "COMPLETED"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : bulkActiveJob.status === "FAILED"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {uploadingBulk && (
                          <FaSpinner size={10} className="animate-spin" />
                        )}
                        {bulkActiveJob.status || "PROCESSING"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-[10px] text-slate-500 block">Total Rows</span>
                        <span className="text-sm font-bold font-mono text-white">
                          {bulkActiveJob.totalRows ?? "—"}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-[10px] text-emerald-500 block">Imported</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {bulkActiveJob.successCount ?? 0}
                        </span>
                      </div>
                      <div className="bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                        <span className="text-[10px] text-rose-500 block">Failed</span>
                        <span className="text-sm font-bold font-mono text-rose-400">
                          {bulkActiveJob.failedCount ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Row Errors */}
                    {Array.isArray(bulkActiveJob.errors) && bulkActiveJob.errors.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                        <p className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                          <FaExclamationTriangle size={11} />
                          Row Parsing Errors ({bulkActiveJob.errors.length}):
                        </p>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {bulkActiveJob.errors.map((err, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] p-2 rounded bg-rose-500/5 border border-rose-500/20 text-rose-300 flex justify-between gap-2"
                            >
                              <span>
                                Row {err.rowNumber || idx + 2}: {err.email || "Unknown"}
                              </span>
                              <span className="text-slate-400 italic font-mono text-[10px]">
                                {err.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkActiveJob(null);
                      setBulkFile(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingBulk || !bulkFile}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5"
                  >
                    {uploadingBulk ? (
                      <>
                        <FaSpinner size={11} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Start Import"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Recent Jobs History Tab */
              <div className="space-y-3 text-xs">
                {loadingHistory ? (
                  <div className="py-10 text-center text-slate-400">
                    <FaSpinner className="animate-spin mx-auto mb-2" size={16} />
                    Loading import history...
                  </div>
                ) : bulkHistory.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 border border-white/[0.04] rounded-lg">
                    No past bulk import jobs recorded for this organization.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {bulkHistory.map((job) => (
                      <div
                        key={job.jobId}
                        className="p-3 rounded-lg border border-white/[0.06] bg-[#090a0f] flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {job.fileName || `Job #${job.jobId}`}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {job.createdAt ? new Date(job.createdAt).toLocaleString() : "Recent"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              job.status === "COMPLETED"
                                ? "bg-emerald-500/15 text-emerald-400"
                                : job.status === "FAILED"
                                ? "bg-rose-500/15 text-rose-400"
                                : "bg-blue-500/15 text-blue-400"
                            }`}
                          >
                            {job.status}
                          </span>
                          <p className="text-[10px] font-mono text-slate-400 mt-1">
                            {job.successCount || 0} / {job.totalRows || 0} ok
                            {(job.failedCount || 0) > 0 && ` (${job.failedCount} err)`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-end pt-2 border-t border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => setBulkTab("upload")}
                    className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Remove Examiner"
          message={`Are you sure you want to remove examiner "${deleteTarget.name || "this examiner"}" from your organization?`}
          confirmText={deleting ? "Removing..." : "Remove Examiner"}
          isDestructive={true}
          onConfirm={handleRemoveExaminer}
          onCancel={() => setDeleteTarget(null)}
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

const ExaminerRow = ({ examiner, onView, onRemove }) => {
  const name = examiner?.name || "Unknown Examiner";
  const email = examiner?.email || "—";

  const department =
    examiner?.department ||
    examiner?.dept ||
    examiner?.departmentName ||
    "—";

  const activeExams =
    examiner?.activeExams ??
    examiner?.activeExamCount ??
    examiner?.examCount ??
    0;

  const rawStatus =
    examiner?.status ||
    examiner?.accountStatus ||
    (examiner?.active === false ? "On Leave" : "Active");

  const status =
    String(rawStatus).toLowerCase() === "active"
      ? "Active"
      : rawStatus;

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      label: "View Profile",
      icon: FaEye,
      onClick: onView,
    },
    {
      label: "Remove Examiner",
      icon: FaTrash,
      onClick: onRemove,
      danger: true,
    },
  ];

  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            {initials}
          </div>

          <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-[11px] text-slate-400">{email}</p>
          </div>
        </div>
      </td>

      <td className="py-3 px-3 text-slate-300">{department}</td>

      <td className="py-3 px-3 text-slate-300 font-mono">
        {activeExams}
      </td>

      <td className="py-3 px-3">
        <span
          className={
            status === "Active"
              ? "px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-amber-500/10 text-amber-400 border-amber-500/20"
          }
        >
          {status}
        </span>
      </td>

      <td className="py-3 px-3 text-right">
        <ActionDropdown items={menuItems} />
      </td>
    </tr>
  );
};
