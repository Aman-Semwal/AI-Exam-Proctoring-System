import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaPlus, FaTimes, FaEllipsisV } from "react-icons/fa";
import api from "../../services/api";

export default function Examiners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examiners, setExaminers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [newExaminer, setNewExaminer] = useState({
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

  const fetchExaminers = async () => {
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
  };

  useEffect(() => {
    fetchExaminers();
  }, []);

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
      setError("Organization ID not found. Please login again.");
      return;
    }

    if (!newExaminer.name.trim() || !newExaminer.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setAdding(true);
      setError("");

      await api.post(`/organizations/${orgId}/members`, {
        name: newExaminer.name.trim(),
        email: newExaminer.email.trim(),
        role: "EXAM_CREATOR",
      });

      setNewExaminer({
        name: "",
        email: "",
      });

      setShowAddModal(false);

      await fetchExaminers();
    } catch (err) {
      console.error("Failed to add examiner:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to add examiner. Please try again."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveExaminer = async (examiner) => {
    const orgId = getOrgId();

    if (!orgId || !examiner?.id) {
      setError("Examiner information is incomplete.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${examiner.name || "this examiner"} from the organization?`
    );

    if (!confirmed) return;

    try {
      setError("");

      await api.delete(
        `/organizations/${orgId}/members/${examiner.id}`
      );

      setExaminers((prev) =>
        prev.filter((item) => item.id !== examiner.id)
      );
    } catch (err) {
      console.error("Failed to remove examiner:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to remove examiner. Please try again."
      );
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
              Manage faculty members and exam paper creators for your
              organization.
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
            Add New Examiner
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
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3">Active Exams</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredExaminers.length > 0 ? (
                    filteredExaminers.map((examiner) => (
                      <ExaminerRow
                        key={examiner.id}
                        examiner={examiner}
                        onRemove={handleRemoveExaminer}
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
            {/* Modal Header */}
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

            {/* Form */}
            <form onSubmit={handleAddExaminer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={newExaminer.name}
                  onChange={(e) =>
                    setNewExaminer((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter examiner name"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  value={newExaminer.email}
                  onChange={(e) =>
                    setNewExaminer((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder="examiner@college.edu"
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
                  {adding ? "Adding..." : "Add Examiner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const ExaminerRow = ({ examiner, onRemove }) => {
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
        {department}
      </td>

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

      <td className="py-3 px-3">
        <div className="flex justify-end">
          <button
            type="button"
            title="Remove Examiner"
            onClick={() => onRemove(examiner)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <FaEllipsisV size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
};

