import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaSearch, FaUserPlus, FaEllipsisV } from "react-icons/fa";
import api from "../../services/api";

const ROLE_LABEL = {
  STUDENT:    "Student",
  EXAM_CREATOR: "Examiner",
  PROCTOR:    "Proctor",
  ORG_ADMIN:  "Org Admin",
  SUPER_ADMIN: "Super Admin",
};

const SuperAdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Single GET /api/users — one query with JOIN FETCH on organization.
  // Replaces the old N+1 pattern (GET /organizations → GET /organizations/{id}/members × N).
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const data = response.data?.data ?? response.data ?? [];

      const list = Array.isArray(data) ? data : [];

      const formatted = list.map((u) => ({
        id:    u.id,
        name:  u.name  || "Unknown User",
        email: u.email || "N/A",
        role:  ROLE_LABEL[u.role] || u.role || "User",
        org:   u.orgSlug || "—",
        status: resolveStatus(u),
      }));

      setUsers(formatted);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.response?.data?.message || "Unable to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Derive a display status from invitation status or fallback to Active
  const resolveStatus = (u) => {
    const inv = String(u.invitationStatus || "").toUpperCase();
    if (inv === "PENDING") return "Pending";
    if (inv === "INACTIVE" || inv === "DISABLED") return "Inactive";
    return "Active";
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.org.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/6">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Directory
              </span>

              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                User Directory
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                All students, examiners, proctors, and admins across the platform.
              </p>
            </div>

            <button className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 text-xs transition shadow-sm active:scale-[0.98] w-fit">
              <FaUserPlus size={11} />
              Add New User
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-red-300">{error}</p>
              <button
                onClick={fetchUsers}
                className="text-xs font-semibold text-red-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search by name, email or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/8 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Total: {filtered.length} users
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-187.5 text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/6 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Full Name</th>
                    <th className="pb-3 px-3">Email Address</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">Organization</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/4 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        Loading users...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-white/2 transition">
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400">{u.email}</td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20">
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-300">{u.org}</td>

                        <td className="py-3 px-3">
                          <span
                            className={`text-xs font-medium flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${
                              u.status === "Active"
                                ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                : u.status === "Pending"
                                ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                                : "text-slate-400 bg-slate-500/10 border border-slate-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.status === "Active"
                                  ? "bg-emerald-400"
                                  : u.status === "Pending"
                                  ? "bg-amber-400"
                                  : "bg-slate-400"
                              }`}
                            />
                            {u.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            title="User actions"
                            className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition"
                          >
                            <FaEllipsisV size={11} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminUsers;
