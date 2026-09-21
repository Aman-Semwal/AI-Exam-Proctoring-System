import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaEye,
  FaUserShield,
  FaTrash,
  FaCalendarCheck,
} from "react-icons/fa";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";
import api from "../../services/api";

export default function Proctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [proctors, setProctors] = useState([]);
  const [exams, setExams] = useState([]);

  // NEW: map of examinerId -> [{examId, examTitle}]
  const [examProctorMap, setExamProctorMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  // Detail & Assign Modals
  const [detailProctor, setDetailProctor] = useState(null);
  const [assignProctorTarget, setAssignProctorTarget] = useState(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // NEW: per-assignment removal loading
  const [removingAssignment, setRemovingAssignment] = useState(null); // { examId, examinerId }

  // Toast
  const [toast, setToast] = useState(null);

  const [newProctor, setNewProctor] = useState({
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

  // NEW: fetch which proctors are assigned to each exam and build the map
  const fetchExamProctorMap = async (examList) => {
    if (!examList || examList.length === 0) {
      setExamProctorMap({});
      return;
    }

    try {
      const results = await Promise.allSettled(
        examList.map((exam) =>
          api
            .get(`/exams/${exam.id}/proctors`)
            .then((res) => {
              const data = res?.data?.data ?? res?.data ?? [];
              return Array.isArray(data) ? data : [];
            })
            .catch(() => [])
        )
      );

      // Build map: examinerId -> [{examId, examTitle}]
      const map = {};

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const assignments = result.value; // ProctorAssignmentResponse[]
          assignments.forEach((assignment) => {
            const eid = assignment.examinerId;
            if (!eid) return;
            if (!map[eid]) map[eid] = [];
            // Avoid duplicates
            const alreadyAdded = map[eid].some(
              (a) => String(a.examId) === String(assignment.examId)
            );
            if (!alreadyAdded) {
              map[eid].push({
                examId: assignment.examId,
                examTitle: assignment.examTitle || `Exam #${assignment.examId}`,
              });
            }
          });
        }
      });

      setExamProctorMap(map);
    } catch (err) {
      console.error("Failed to build exam proctor map:", err);
    }
  };

  const fetchProctors = async () => {
    const orgId = getOrgId();

    if (!orgId) {
      setError("Organization ID not found. Please login again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [membersRes, examsRes] = await Promise.all([
        api.get(`/organizations/${orgId}/members`),
        api.get("/exams").catch(() => ({ data: { data: [] } })),
      ]);

      const data = membersRes?.data?.data ?? membersRes?.data ?? [];

      const members = Array.isArray(data)
        ? data
        : Array.isArray(data?.members)
        ? data.members
        : [];

      const proctorMembers = members.filter(
        (member) =>
          String(member?.role || "").toUpperCase() === "PROCTOR"
      );

      setProctors(proctorMembers);

      const examData = examsRes?.data?.data ?? examsRes?.data ?? [];
      const examList = Array.isArray(examData) ? examData : examData?.content || [];
      setExams(examList);

      // NEW: after exams are loaded, fetch per-exam proctor assignments
      await fetchExamProctorMap(examList);
    } catch (err) {
      console.error("Failed to fetch proctors:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load proctors. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProctors();
  }, []);

  const filteredProctors = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return proctors;

    return proctors.filter((proctor) => {
      const name = String(proctor?.name || "").toLowerCase();
      const email = String(proctor?.email || "").toLowerCase();

      const assignedExam = String(
        proctor?.assignedExam ||
          proctor?.examName ||
          proctor?.assignedExamName ||
          ""
      ).toLowerCase();

      // NEW: also search inside examProctorMap titles
      const mappedTitles = (examProctorMap[proctor.id] || [])
        .map((a) => a.examTitle.toLowerCase())
        .join(" ");

      return (
        name.includes(query) ||
        email.includes(query) ||
        assignedExam.includes(query) ||
        mappedTitles.includes(query)
      );
    });
  }, [proctors, searchQuery, examProctorMap]);

  const handleAddProctor = async (e) => {
    e.preventDefault();

    const orgId = getOrgId();

    if (!orgId) {
      setToast({ type: "error", message: "Organization ID not found. Please login again." });
      return;
    }

    if (!newProctor.name.trim() || !newProctor.email.trim()) {
      setToast({ type: "error", message: "Name and email are required." });
      return;
    }

    try {
      setAdding(true);

      await api.post(`/organizations/${orgId}/members`, {
        name: newProctor.name.trim(),
        email: newProctor.email.trim(),
        role: "PROCTOR",
      });

      setToast({
        type: "success",
        message: `Proctor "${newProctor.name}" added successfully.`,
      });

      setNewProctor({
        name: "",
        email: "",
      });

      setShowAddModal(false);
      await fetchProctors();
    } catch (err) {
      console.error("Failed to add proctor:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Unable to add proctor. Please try again.",
      });
    } finally {
      setAdding(false);
    }
  };

  const handleAssignToExam = async (e) => {
    e.preventDefault();

    if (!selectedExamId || !assignProctorTarget) {
      setToast({ type: "error", message: "Please select an exam." });
      return;
    }

    try {
      setAssigning(true);

      await api.post(`/exams/${selectedExamId}/proctors`, {
        examinerId: assignProctorTarget.id,
      });

      const selectedExam = exams.find((x) => String(x.id) === String(selectedExamId));
      setToast({
        type: "success",
        message: `Proctor "${assignProctorTarget.name}" assigned to "${selectedExam?.title || "Exam"}".`,
      });

      setAssignProctorTarget(null);
      setSelectedExamId("");
      await fetchProctors();
    } catch (err) {
      console.error("Assign proctor error:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to assign proctor to exam.",
      });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveProctor = async () => {
    const orgId = getOrgId();

    if (!orgId || !deleteTarget?.id) {
      setToast({ type: "error", message: "Proctor information is incomplete." });
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `/organizations/${orgId}/members/${deleteTarget.id}`
      );

      setToast({
        type: "success",
        message: `Proctor "${deleteTarget.name || "Proctor"}" removed successfully.`,
      });

      setDeleteTarget(null);
      await fetchProctors();
    } catch (err) {
      console.error("Failed to remove proctor:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Unable to remove proctor. Please try again.",
      });
    } finally {
      setDeleting(false);
    }
  };

  // NEW: remove a proctor from a specific exam
  const handleRemoveFromExam = async (examId, examinerId, examTitle) => {
    const key = `${examId}-${examinerId}`;
    try {
      setRemovingAssignment({ examId, examinerId });

      await api.delete(`/exams/${examId}/proctors/${examinerId}`);

      // Update examProctorMap in state without re-fetching everything
      setExamProctorMap((prev) => {
        const updated = { ...prev };
        if (updated[examinerId]) {
          updated[examinerId] = updated[examinerId].filter(
            (a) => String(a.examId) !== String(examId)
          );
        }
        return updated;
      });

      // Also keep detailProctor in sync if the modal is open
      // (no separate state needed — it reads from examProctorMap directly)

      setToast({
        type: "success",
        message: `Removed from "${examTitle}".`,
      });
    } catch (err) {
      console.error("Failed to remove proctor from exam:", err);
      setToast({
        type: "error",
        message: err?.response?.data?.message || "Failed to remove proctor from exam.",
      });
    } finally {
      setRemovingAssignment(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      <OrganizationSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Proctors Management
            </h1>

            <p className="text-[11px] text-slate-400">
              Monitor invigilators and assigned exam duties in real-time.
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
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Invigilators
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                All Proctors
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Manage invigilation duties, shifts, and live exam allocations.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
            >
              <FaPlus size={11} />
              Add Proctor
            </button>
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
                  placeholder="Search proctors by name, email, or assigned exam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total Proctors:{" "}
                <span className="font-semibold text-white">
                  {filteredProctors.length}
                </span>
              </div>
            </div>

            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading proctors...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Proctor</th>
                      <th className="pb-3 px-3">Assigned Exams</th>
                      <th className="pb-3 px-3">Shift</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredProctors.length > 0 ? (
                      filteredProctors.map((proctor) => (
                        <ProctorRow
                          key={proctor.id}
                          proctor={proctor}
                          assignedExams={examProctorMap[proctor.id] || []}
                          onView={() => setDetailProctor(proctor)}
                          onAssign={() => {
                            setAssignProctorTarget(proctor);
                            setSelectedExamId(exams[0]?.id ? String(exams[0].id) : "");
                          }}
                          onRemove={() => setDeleteTarget(proctor)}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          {searchQuery
                            ? "No proctors found matching your search."
                            : "No proctors found for this organization."}
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

      {/* Add Proctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Add New Proctor
                </h2>

                <p className="text-[11px] text-slate-500 mt-1">
                  Register an invigilator for your organization.
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

            <form onSubmit={handleAddProctor} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Full Name *
                </label>

                <input
                  type="text"
                  required
                  value={newProctor.name}
                  onChange={(e) =>
                    setNewProctor((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Marcus Thorne"
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
                  value={newProctor.email}
                  onChange={(e) =>
                    setNewProctor((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="proctor@college.edu"
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
                  {adding ? "Adding..." : "Add Proctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign to Exam Modal */}
      {assignProctorTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white">Assign Exam Duty</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Assign {assignProctorTarget.name} to monitor an active/upcoming assessment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignProctorTarget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleAssignToExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Select Exam *
                </label>
                {exams.length === 0 ? (
                  <p className="text-slate-500">No exams available in the system.</p>
                ) : (
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select an exam</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title || `Exam #${ex.id}`} ({ex.status || "SCHEDULED"})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setAssignProctorTarget(null)}
                  className="px-4 py-2 rounded-lg border border-white/[0.08] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedExamId}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold"
                >
                  {assigning ? "Assigning..." : "Confirm Duty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proctor Details Modal */}
      {detailProctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.1] rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.07]">
              <h3 className="text-base font-bold text-white">Proctor Details</h3>
              <button
                type="button"
                onClick={() => setDetailProctor(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-white/[0.05]">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-sm">
                  {(detailProctor.name || "PR").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{detailProctor.name || "Proctor"}</p>
                  <p className="text-slate-400 text-[11px]">{detailProctor.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Role</span>
                  <p className="font-semibold text-blue-400 mt-1">PROCTOR</p>
                </div>
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                  <span className="text-slate-500 block">Status</span>
                  <p className="font-semibold text-emerald-400 mt-1">
                    {detailProctor.status || "Active"}
                  </p>
                </div>
              </div>

              {/* NEW: Assigned Exams with Remove button */}
              <div className="bg-[#090a0f] p-3 rounded-lg border border-white/[0.05]">
                <span className="text-slate-500 block mb-2">Assigned Examinations</span>

                {(examProctorMap[detailProctor.id] || []).length === 0 ? (
                  <p className="text-slate-500 italic">No exams currently assigned.</p>
                ) : (
                  <ul className="space-y-2">
                    {(examProctorMap[detailProctor.id] || []).map((assignment) => {
                      const isRemoving =
                        removingAssignment?.examId === assignment.examId &&
                        removingAssignment?.examinerId === detailProctor.id;

                      return (
                        <li
                          key={assignment.examId}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-slate-200 truncate">
                            {assignment.examTitle}
                          </span>
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() =>
                              handleRemoveFromExam(
                                assignment.examId,
                                detailProctor.id,
                                assignment.examTitle
                              )
                            }
                            className="flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50 transition"
                          >
                            {isRemoving ? "Removing..." : "Remove"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailProctor(null)}
                className="px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Proctor Confirm Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          title="Remove Proctor"
          message={`Are you sure you want to remove proctor "${deleteTarget.name || "this proctor"}" from your organization? They will be unassigned from monitoring duties.`}
          confirmText={deleting ? "Removing..." : "Remove Proctor"}
          isDestructive={true}
          onConfirm={handleRemoveProctor}
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

const ProctorRow = ({ proctor, assignedExams, onView, onAssign, onRemove }) => {
  const name = proctor?.name || "Unknown Proctor";
  const email = proctor?.email || "—";

  const shift =
    proctor?.shift ||
    proctor?.shiftName ||
    "General Shift";

  const rawStatus =
    proctor?.status ||
    proctor?.monitoringStatus ||
    (proctor?.active === false ? "Offline" : "Idle");

  const normalizedStatus = String(rawStatus).toLowerCase();

  let status = rawStatus;

  if (normalizedStatus === "monitoring") {
    status = "Monitoring";
  } else if (normalizedStatus === "idle") {
    status = "Idle";
  } else if (normalizedStatus === "offline") {
    status = "Offline";
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getStatusBadge = () => {
    if (status === "Monitoring") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }

    if (status === "Idle") {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }

    return "bg-slate-800 text-slate-400 border-slate-700";
  };

  const menuItems = [
    {
      label: "View Details",
      icon: FaEye,
      onClick: onView,
    },
    {
      label: "Assign Exam Duty",
      icon: FaCalendarCheck,
      onClick: onAssign,
    },
    {
      label: "Remove Proctor",
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

      {/* NEW: Assigned Exams column with badges */}
      <td className="py-3 px-3">
        {assignedExams.length === 0 ? (
          <span className="text-slate-500 italic text-[11px]">No assignments</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {assignedExams.map((assignment) => (
              <span
                key={assignment.examId}
                className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full"
              >
                {assignment.examTitle}
              </span>
            ))}
          </div>
        )}
      </td>

      <td className="py-3 px-3 text-slate-300">
        {shift}
      </td>

      <td className="py-3 px-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge()}`}
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
