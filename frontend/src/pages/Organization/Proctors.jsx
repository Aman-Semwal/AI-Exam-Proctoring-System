import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import {
  FaSearch,
  FaPlus,
  FaTimes,
  FaEllipsisV,
} from "react-icons/fa";
import api from "../../services/api";

export default function Proctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [proctors, setProctors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newProctor, setNewProctor] = useState({
    name: "",
    email: "",
  });

  const getOrgId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return user?.orgId;
    } catch {
      return null;
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

      const response = await api.get(
        `/organizations/${orgId}/members`
      );

      const data = response?.data?.data ?? response?.data ?? [];

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

      return (
        name.includes(query) ||
        email.includes(query) ||
        assignedExam.includes(query)
      );
    });
  }, [proctors, searchQuery]);

  const handleAddProctor = async (e) => {
    e.preventDefault();

    const orgId = getOrgId();

    if (!orgId) {
      setError("Organization ID not found. Please login again.");
      return;
    }

    if (!newProctor.name.trim() || !newProctor.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      await api.post(`/organizations/${orgId}/members`, {
        name: newProctor.name.trim(),
        email: newProctor.email.trim(),
        role: "PROCTOR",
      });

      setNewProctor({
        name: "",
        email: "",
      });

      setShowAddModal(false);

      await fetchProctors();
    } catch (err) {
      console.error("Failed to add proctor:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to add proctor. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveProctor = async (proctor) => {
    const orgId = getOrgId();

    if (!orgId || !proctor?.id) {
      setError("Proctor information is incomplete.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${proctor.name || "this proctor"} from the organization?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/organizations/${orgId}/members/${proctor.id}`
      );

      setProctors((prev) =>
        prev.filter((item) => item.id !== proctor.id)
      );
    } catch (err) {
      console.error("Failed to remove proctor:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to remove proctor. Please try again."
      );
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
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                Organization Admin
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
                Manage proctor shifts and live surveillance status seamlessly.
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
              Assign Proctor
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
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Proctor</th>
                      <th className="pb-3 px-3">Assigned Exam</th>
                      <th className="pb-3 px-3">Shift</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredProctors.length > 0 ? (
                      filteredProctors.map((proctor) => (
                        <ProctorRow
                          key={proctor.id}
                          proctor={proctor}
                          onRemove={handleRemoveProctor}
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
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Assign Proctor
                </h2>

                <p className="text-[11px] text-slate-500 mt-1">
                  Add an invigilator to your organization.
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

            {/* Form */}
            <form onSubmit={handleAddProctor} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={newProctor.name}
                  onChange={(e) =>
                    setNewProctor((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter proctor name"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  value={newProctor.email}
                  onChange={(e) =>
                    setNewProctor((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="proctor@college.edu"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-300 bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="px-4 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adding ? "Adding..." : "Add Proctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ProctorRow = ({ proctor, onRemove }) => {
  const name = proctor?.name || "Unknown Proctor";
  const email = proctor?.email || "—";

  const assignedExam =
    proctor?.assignedExam ||
    proctor?.examName ||
    proctor?.assignedExamName ||
    "Not Assigned";

  const shift =
    proctor?.shift ||
    proctor?.shiftName ||
    "Not Assigned";

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

      <td className="py-3 px-3 text-slate-300">
        {assignedExam}
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

      <td className="py-3 px-3">
        <div className="flex justify-end">
          <button
            type="button"
            title="Remove Proctor"
            onClick={() => onRemove(proctor)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <FaEllipsisV size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};

