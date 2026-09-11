import { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaPlus,
  FaEllipsisV,
  FaTimes,
} from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import api from "../../services/api";

const Students = () => {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  /* ================= FETCH STUDENTS ================= */

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const orgId = storedUser?.orgId;

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

  /* ================= FILTER ================= */

  const filteredStudents = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return students.filter((student) => {
      const name = String(student.name || "").toLowerCase();
      const email = String(student.email || "").toLowerCase();

      return (
        name.includes(searchText) ||
        email.includes(searchText)
      );
    });
  }, [students, search]);

  /* ================= ADD STUDENT ================= */

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const orgId = storedUser?.orgId;

      if (!orgId) {
        throw new Error("Organization ID not found.");
      }

      await api.post(`/organizations/${orgId}/members`, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: "STUDENT",
      });

      setForm({
        name: "",
        email: "",
      });

      setShowAddModal(false);

      await loadStudents();
    } catch (err) {
      console.error("Add student error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add student."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================= REMOVE STUDENT ================= */

  const handleRemoveStudent = async (student) => {
    const confirmed = window.confirm(
      `Remove ${student.name || "this student"} from the organization?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const storedUser = JSON.parse(
        localStorage.getItem("user") || "{}"
      );

      const orgId = storedUser?.orgId;

      if (!orgId || !student.id) {
        throw new Error("Organization or student ID is missing.");
      }

      await api.delete(
        `/organizations/${orgId}/members/${student.id}`
      );

      await loadStudents();
    } catch (err) {
      console.error("Remove student error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to remove student."
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      {/* Organization Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
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
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                Anchal Saini
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Administration
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                All Enrolled Students
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                View and manage students enrolled in your organization.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowAddModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-all text-xs shadow-sm active:scale-[0.98] w-fit"
            >
              <FaPlus size={11} />
              Add Student
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredStudents.length} of{" "}
                {students.length} students
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
                <table className="w-full min-w-[650px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">
                        Student
                      </th>

                      <th className="pb-3 px-3">
                        Batch
                      </th>

                      <th className="pb-3 px-3">
                        Exams Given
                      </th>

                      <th className="pb-3 px-3">
                        Status
                      </th>

                      <th className="pb-3 px-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredStudents.map((student) => (
                      <StudentRow
                        key={student.id || student.email}
                        student={student}
                        onRemove={handleRemoveStudent}
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

      {/* ================= ADD STUDENT MODAL ================= */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Add Student
                </h3>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  Add a new student to your organization
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

            {/* Form */}
            <form
              onSubmit={handleAddStudent}
              className="p-5 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter student name"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  placeholder="student@example.com"
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-lg border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.03] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition"
                >
                  {saving ? "Adding..." : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================= STUDENT ROW ================= */

const StudentRow = ({ student, onRemove }) => {
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

  return (
    <tr className="hover:bg-white/[0.02] transition">
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
        <div className="relative inline-block group">
          <button
            type="button"
            className="text-slate-400 hover:text-white p-1.5 transition"
          >
            <FaEllipsisV size={11} />
          </button>

          <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-32 bg-[#121520] border border-white/[0.08] rounded-lg shadow-xl z-20 overflow-hidden">
            <button
              type="button"
              onClick={() => onRemove(student)}
              className="w-full px-3 py-2 text-left text-[11px] text-red-400 hover:bg-red-500/10 transition"
            >
              Remove Student
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
};

export default Students;
