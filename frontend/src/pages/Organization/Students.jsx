import { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaFileUpload,
  FaEye,
  FaTrash,
  FaTimes,
  FaFileDownload,
  FaHistory,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import api from "../../services/api";

const Students = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkActiveJob, setBulkActiveJob] = useState(null);
  const [bulkTab, setBulkTab] = useState("upload"); // "upload" | "history"
  const [bulkHistory, setBulkHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [detailStudent, setDetailStudent] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
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

  /* ================= FETCH STUDENTS ================= */

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const orgId = currentUser?.orgId;

      if (!orgId) {
        throw new Error("Organization ID not found.");
      }

      const response = await api.get(
        `/organizations/${orgId}/members`
      );

      const members =
        response.data?.data ||
        response.data ||
        [];

      const studentMembers = members.filter(
        (member) =>
          String(member.role || "").toUpperCase() === "STUDENT"
      );

      setStudents(studentMembers);
    } catch (err) {
      console.error("Students fetch error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  /* ================= BULK SELECTION ================= */
  
  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  /* ================= FILTER ================= */

  const searchText = search.toLowerCase().trim();
  const filteredStudents = students.filter((student) => {
    const name = String(student.name || "").toLowerCase();
    const email = String(student.email || "").toLowerCase();
    return name.includes(searchText) || email.includes(searchText);
  });

  /* ================= ADD STUDENT ================= */

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setToast({ type: "error", message: "Name and email are required." });
      return;
    }

    try {
      setSaving(true);
      const orgId = currentUser?.orgId;

      if (!orgId) {
        throw new Error("Organization ID not found.");
      }

      await api.post(`/organizations/${orgId}/members`, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: "STUDENT",
      });

      setToast({ type: "success", message: `Student "${form.name}" added successfully.` });
      setForm({ name: "", email: "" });
      setShowAddModal(false);
      await loadStudents();
    } catch (err) {
      console.error("Add student error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to add student.",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= BULK IMPORT HELPERS ================= */

  const handleDownloadTemplate = () => {
    const headers = "name,email,role,rollno,semester,batch,course,stream,appliedrole";
    const sampleRows = [
      "Aarav Sharma,aarav.sharma@example.com,STUDENT,CS2026-001,6,2026,B.Tech,CSE,Frontend Developer",
      "Priya Patel,priya.patel@example.com,STUDENT,CS2026-002,6,2026,B.Tech,CSE,Backend Developer",
    ].join("\n");
    const blob = new Blob([`${headers}\n${sampleRows}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "students_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchBulkHistory = async () => {
    const orgId = currentUser?.orgId;
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
                message: `Import completed: ${job.successCount || 0} students added (${job.failedCount || 0} failed).`,
              });
              await loadStudents();
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
      const orgId = currentUser?.orgId;

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
        setTimeout(loadStudents, 2000);
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

  /* ================= REMOVE STUDENT ================= */

  const handleRemoveStudent = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const orgId = currentUser?.orgId;

      if (!orgId || !deleteTarget.id) {
        throw new Error("Organization or student ID is missing.");
      }

      await api.delete(
        `/organizations/${orgId}/members/${deleteTarget.id}`
      );

      setToast({
        type: "success",
        message: `Student "${deleteTarget.name || "Student"}" removed successfully.`,
      });

      setDeleteTarget(null);
      setSelectedStudentIds((prev) => prev.filter(id => id !== deleteTarget.id));
      await loadStudents();
    } catch (err) {
      console.error("Remove student error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to remove student.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;

    try {
      setDeleting(true);
      const orgId = currentUser?.orgId;

      if (!orgId) throw new Error("Organization ID not found.");

      await api.delete(`/organizations/${orgId}/members`, {
        params: { userIds: selectedStudentIds.join(",") }
      });

      setToast({
        type: "success",
        message: `${selectedStudentIds.length} students removed successfully.`,
      });

      setShowBulkDeleteConfirm(false);
      setSelectedStudentIds([]);
      await loadStudents();
    } catch (err) {
      console.error("Bulk delete error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to delete students.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      {/* Organization Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/7 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Students Management
            </h1>

            <p className="text-[11px] text-slate-400">
              Manage students in your organization
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

        {/* Main Body */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              <span>{error}</span>

              <button
                type="button"
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-200"
              >
                <FaTimes size={11} />
              </button>
            </div>
          )}

          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/6">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Administration
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                All Enrolled Students
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                View, register, and manage students enrolled in your organization.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {selectedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 font-semibold px-3.5 py-2.5 rounded-lg transition-all text-xs active:scale-[0.98] mr-2"
                >
                  <FaTrash size={11} />
                  Delete Selected ({selectedStudentIds.length})
                </button>
              )}
              
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/8 text-slate-200 font-semibold px-3.5 py-2.5 rounded-lg transition-all text-xs active:scale-[0.98]"
              >
                <FaFileUpload size={11} className="text-blue-400" />
                Bulk Import
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-all text-xs shadow-sm active:scale-[0.98]"
              >
                <FaPlus size={11} />
                Add Student
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/8 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredStudents.length} of {students.length} students
              </p>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading students...
              </div>
            ) : (
              /* Students Table */
              <div className="overflow-x-auto">
                <table className="w-full min-w-162.5 text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3 w-10 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedStudentIds.length > 0 && selectedStudentIds.length === filteredStudents.length}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 checked:bg-blue-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-[#121520]"
                        />
                      </th>
                      <th className="pb-3 px-3">Student</th>
                      <th className="pb-3 px-3">Batch / Course</th>
                      <th className="pb-3 px-3">Exams Given</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/4 text-xs">
                    {filteredStudents.map((student) => (
                      <StudentRow
                        key={student.id || student.email}
                        student={student}
                        isSelected={selectedStudentIds.includes(student.id)}
                        onToggleSelect={() => toggleSelectStudent(student.id)}
                        onView={() => setDetailStudent(student)}
                        onRemove={() => setDeleteTarget(student)}
                      />
                    ))}

                    {filteredStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-8 text-center text-slate-500"
                        >
                          {search
                            ? `No students found matching "${search}"`
                            : "No students found in this organization."}
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

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Add Single Student
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send invite or register student to organization
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/8 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="student@university.edu"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/8 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-white/8 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold"
                >
                  {saving ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#121520] border border-white/8 rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FaFileUpload className="text-blue-400" size={14} />
                  Bulk Import Students
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Import candidates from CSV/XLSX or view previous processing jobs.
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
            <div className="flex border-b border-white/6 mb-4 gap-4 text-xs font-semibold">
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/6">
                  <div className="text-[11px]">
                    <span className="text-slate-300 font-medium block">Need the exact CSV format?</span>
                    <span className="text-slate-500">Columns: name, email, role, rollno, semester, batch, course</span>
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
                <div className="p-4 rounded-xl border border-dashed border-white/15 bg-[#090a0f] text-center">
                  <FaFileUpload size={24} className="mx-auto text-blue-400 mb-2" />
                  <p className="text-slate-200 font-medium">
                    {bulkFile ? bulkFile.name : "Choose CSV or XLSX file to upload"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Accepts .csv and .xlsx spreadsheets
                  </p>

                  <input
                    type="file"
                    id="bulk-file-input"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => {
                      setBulkFile(e.target.files[0] || null);
                      setBulkActiveJob(null);
                    }}
                    className="hidden"
                  />

                  <label
                    htmlFor="bulk-file-input"
                    className="mt-3 inline-block px-4 py-1.5 rounded-lg bg-white/6 hover:bg-white/10 text-blue-400 font-semibold cursor-pointer transition"
                  >
                    {bulkFile ? "Change File" : "Browse Computer"}
                  </label>
                </div>

                {/* Live Processing Card & Row Error Report */}
                {bulkActiveJob && (
                  <div className="p-4 rounded-xl border border-white/8 bg-[#090a0f] space-y-3">
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
                      <div className="bg-white/2 p-2 rounded-lg border border-white/4">
                        <span className="text-[10px] text-slate-500 block">Total Rows</span>
                        <span className="text-sm font-bold font-mono text-white">
                          {bulkActiveJob.totalRows ?? "—"}
                        </span>
                      </div>
                      <div className="bg-white/2 p-2 rounded-lg border border-white/4">
                        <span className="text-[10px] text-emerald-500 block">Imported</span>
                        <span className="text-sm font-bold font-mono text-emerald-400">
                          {bulkActiveJob.successCount ?? 0}
                        </span>
                      </div>
                      <div className="bg-white/2 p-2 rounded-lg border border-white/4">
                        <span className="text-[10px] text-rose-500 block">Failed</span>
                        <span className="text-sm font-bold font-mono text-rose-400">
                          {bulkActiveJob.failedCount ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Row Errors */}
                    {Array.isArray(bulkActiveJob.errors) && bulkActiveJob.errors.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-white/5">
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

                <div className="flex justify-end gap-2 pt-2 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkModal(false);
                      setBulkActiveJob(null);
                      setBulkFile(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-white/8 text-slate-300 hover:text-white"
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
                  <div className="py-10 text-center text-slate-500 border border-white/4 rounded-lg">
                    No past bulk import jobs recorded for this organization.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {bulkHistory.map((job) => (
                      <div
                        key={job.jobId}
                        className="p-3 rounded-lg border border-white/6 bg-[#090a0f] flex items-center justify-between"
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
                <div className="flex justify-end pt-2 border-t border-white/6">
                  <button
                    type="button"
                    onClick={() => setBulkTab("upload")}
                    className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-white"
                  >
                    Back to Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/7">
              <h3 className="text-base font-bold text-white">Student Details</h3>
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                  {(detailStudent.name || "ST").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{detailStudent.name || "Unknown Student"}</p>
                  <p className="text-slate-400 text-[11px]">{detailStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5">
                  <span className="text-slate-500 block">Role</span>
                  <p className="font-semibold text-blue-400 mt-1">{detailStudent.role || "STUDENT"}</p>
                </div>
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5">
                  <span className="text-slate-500 block">Status</span>
                  <p className="font-semibold text-emerald-400 mt-1">{detailStudent.status || "ACTIVE"}</p>
                </div>
              </div>

              <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5">
                <span className="text-slate-500 block">Course / Batch</span>
                <p className="text-slate-200 mt-1">
                  {detailStudent.batch || detailStudent.course || detailStudent.semester || "Not Assigned"}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Student Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Remove Student"
          message={`Are you sure you want to remove student "${deleteTarget.name || "this student"}" from your organization? They will lose access to scheduled exams.`}
          confirmText={deleting ? "Removing..." : "Remove Student"}
          isDestructive={true}
          onConfirm={handleRemoveStudent}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Bulk Remove Confirmation Dialog */}
      {showBulkDeleteConfirm && (
        <ConfirmDialog
          isOpen={showBulkDeleteConfirm}
          title="Delete Selected Students"
          message={`Are you sure you want to permanently delete ${selectedStudentIds.length} selected students? They will lose access to all exams. This cannot be undone.`}
          confirmText={deleting ? "Deleting..." : "Delete All Selected"}
          isDestructive={true}
          onConfirm={handleBulkDelete}
          onCancel={() => setShowBulkDeleteConfirm(false)}
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
};

/* ================= STUDENT ROW ================= */

const StudentRow = ({ student, isSelected, onToggleSelect, onView, onRemove }) => {
  const studentName = student.name || "Unknown Student";
  const studentEmail = student.email || "No email";

  const initials = studentName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const status =
    String(student.status || "ACTIVE").toUpperCase();

  const isActive =
    status === "ACTIVE" ||
    status === "ENABLED";

  const batch =
    student.batch ||
    student.course ||
    student.semester ||
    "—";

  const exams =
    student.exams ??
    student.examsGiven ??
    student.examCount ??
    0;

  const menuItems = [
    {
      label: "View Details",
      icon: FaEye,
      onClick: onView,
    },
    {
      label: "Remove Student",
      icon: FaTrash,
      onClick: onRemove,
      danger: true,
    },
  ];

  return (
    <tr className={`hover:bg-white/2 transition ${isSelected ? 'bg-blue-500/5' : ''}`}>
      <td className="py-3 px-3 text-center">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 checked:bg-blue-500 text-blue-500 focus:ring-blue-500 focus:ring-offset-[#121520]"
        />
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            {initials || "ST"}
          </div>

          <div>
            <p className="font-semibold text-white">
              {studentName}
            </p>

            <p className="text-[11px] text-slate-400">
              {studentEmail}
            </p>
          </div>
        </div>
      </td>

      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
        {batch}
      </td>

      <td className="py-3 px-3 text-slate-300 font-mono">
        {exams}
      </td>

      <td className="py-3 px-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>

      <td className="py-3 px-3 text-right">
        <ActionDropdown items={menuItems} />
      </td>
    </tr>
  );
};

export default Students;
