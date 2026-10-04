import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaSearch,
  FaUserPlus,
  FaEye,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";
import api from "../../services/api";
import ActionDropdown from "../../components/common/ActionDropdown";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Toast from "../../components/common/Toast";

const ROLE_LABEL = {
  STUDENT: "Student",
  EXAM_CREATOR: "Examiner",
  PROCTOR: "Proctor",
  ORG_ADMIN: "Org Admin",
  SUPER_ADMIN: "Super Admin",
};

const SuperAdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add user modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    orgId: "",
    name: "",
    email: "",
    role: "STUDENT",
  });
  const [addErrors, setAddErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);

  // Detail modal
  const [detailUser, setDetailUser] = useState(null);

  // Remove confirm
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  /* ===================== Fetch users ===================== */

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const data = response.data?.data ?? response.data ?? [];

      // Handle paginated response (Spring Page<T>)
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      const formatted = list.map((u) => ({
        id: u.id,
        name: u.name || "Unknown User",
        email: u.email || "N/A",
        role: u.role || "STUDENT",
        roleLabel: ROLE_LABEL[u.role] || u.role || "User",
        org: u.orgSlug || "—",
        orgId: u.orgId || null,
        status: resolveStatus(u),
      }));

      setUsers(formatted);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const resolveStatus = (u) => {
    const inv = String(u.invitationStatus || "").toUpperCase();
    if (inv === "PENDING") return "Pending";
    if (inv === "INACTIVE" || inv === "DISABLED") return "Inactive";
    return "Active";
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ===================== Fetch orgs for dropdown ===================== */

  const fetchOrgs = async () => {
    try {
      setOrgsLoading(true);
      const response = await api.get("/organizations");
      const data = response.data?.data ?? response.data;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setOrgs(list);

      // Pre-select first org
      if (list.length > 0 && !addForm.orgId) {
        setAddForm((prev) => ({ ...prev, orgId: String(list[0].id) }));
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setOrgsLoading(false);
    }
  };

  /* ===================== Open Add User Modal ===================== */

  const openAddModal = () => {
    setShowAddModal(true);
    setAddForm({ orgId: "", name: "", email: "", role: "STUDENT" });
    setAddErrors({});
    fetchOrgs();
  };

  const closeAddModal = () => {
    if (addLoading) return;
    setShowAddModal(false);
    setAddForm({ orgId: "", name: "", email: "", role: "STUDENT" });
    setAddErrors({});
  };

  /* ===================== Validate & Submit ===================== */

  const validateAddForm = () => {
    const errors = {};

    if (!addForm.orgId) errors.orgId = "Please select an organization";
    if (!addForm.name.trim()) errors.name = "Name is required";
    if (!addForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      errors.email = "Invalid email format";
    }
    if (!addForm.role) errors.role = "Role is required";

    setAddErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateAddForm()) return;

    try {
      setAddLoading(true);

      await api.post(`/organizations/${addForm.orgId}/members`, {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
      });

      closeAddModal();
      setToast({ message: "User invited successfully!", type: "success" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to invite user:", err);

      const apiErrors = err.response?.data?.data;
      if (apiErrors && typeof apiErrors === "object") {
        setAddErrors(apiErrors);
      } else {
        setAddErrors({
          general:
            err.response?.data?.message ||
            "Failed to invite user. Please try again.",
        });
      }
    } finally {
      setAddLoading(false);
    }
  };

  /* ===================== Remove User ===================== */

  const handleRemoveUser = async () => {
    if (!removeTarget) return;

    try {
      setRemoveLoading(true);

      await api.delete(
        `/organizations/${removeTarget.orgId}/members/${removeTarget.id}`
      );

      setRemoveTarget(null);
      setToast({ message: "User removed successfully.", type: "success" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to remove user:", err);
      setToast({
        message:
          err.response?.data?.message || "Failed to remove user.",
        type: "error",
      });
      setRemoveTarget(null);
    } finally {
      setRemoveLoading(false);
    }
  };

  /* ===================== Filter ===================== */

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q) ||
        u.org.toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  /* ===================== Render ===================== */

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
                All students, examiners, proctors, and admins across the
                platform.
              </p>
            </div>

            <button
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 text-xs transition shadow-sm active:scale-[0.98] w-fit"
            >
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
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
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
                      <td
                        colSpan="6"
                        className="py-12 text-center text-slate-400"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-12 text-center text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-white/2 transition"
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                            <span>{u.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-400">
                          {u.email}
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20">
                            {u.roleLabel}
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
                          <ActionDropdown
                            actions={[
                              {
                                label: "View Profile",
                                icon: FaEye,
                                onClick: () => setDetailUser(u),
                              },
                              ...(u.orgId
                                ? [
                                    {
                                      label: "Remove User",
                                      icon: FaTrashAlt,
                                      danger: true,
                                      onClick: () => setRemoveTarget(u),
                                    },
                                  ]
                                : []),
                            ]}
                          />
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

      {/* =============== Add New User Modal =============== */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAddModal();
          }}
        >
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Invite New User
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Send an invitation to join an organization.
                </p>
              </div>

              <button
                onClick={closeAddModal}
                disabled={addLoading}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* General error */}
              {addErrors.general && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <p className="text-xs text-red-300">{addErrors.general}</p>
                </div>
              )}

              {/* Organization */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Organization <span className="text-rose-400">*</span>
                </label>

                {orgsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <span className="w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    Loading organizations...
                  </div>
                ) : (
                  <select
                    value={addForm.orgId}
                    onChange={(e) =>
                      setAddForm((prev) => ({
                        ...prev,
                        orgId: e.target.value,
                      }))
                    }
                    disabled={addLoading}
                    className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition disabled:opacity-50 ${
                      addErrors.orgId
                        ? "border-rose-500/40 focus:border-rose-500"
                        : "border-white/8 focus:border-purple-500"
                    }`}
                  >
                    <option value="">Select an organization</option>
                    {orgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.slug})
                      </option>
                    ))}
                  </select>
                )}

                {addErrors.orgId && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {addErrors.orgId}
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Full Name <span className="text-rose-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={addLoading}
                  className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50 ${
                    addErrors.name
                      ? "border-rose-500/40 focus:border-rose-500"
                      : "border-white/8 focus:border-purple-500"
                  }`}
                />

                {addErrors.name && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {addErrors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Email Address <span className="text-rose-400">*</span>
                </label>

                <input
                  type="email"
                  placeholder="e.g. john@university.edu"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={addLoading}
                  className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50 ${
                    addErrors.email
                      ? "border-rose-500/40 focus:border-rose-500"
                      : "border-white/8 focus:border-purple-500"
                  }`}
                />

                {addErrors.email && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {addErrors.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Role <span className="text-rose-400">*</span>
                </label>

                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  disabled={addLoading}
                  className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none transition disabled:opacity-50 ${
                    addErrors.role
                      ? "border-rose-500/40 focus:border-rose-500"
                      : "border-white/8 focus:border-purple-500"
                  }`}
                >
                  <option value="STUDENT">Student</option>
                  <option value="EXAM_CREATOR">Examiner</option>
                  <option value="PROCTOR">Proctor</option>
                  <option value="ORG_ADMIN">Organization Admin</option>
                </select>

                {addErrors.role && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {addErrors.role}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleAddUser}
                disabled={addLoading}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {addLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Invitation...
                  </span>
                ) : (
                  "Send Invitation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== User Detail Modal =============== */}
      {detailUser && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailUser(null);
          }}
        >
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-sm">
                  {detailUser.name?.[0]?.toUpperCase() || "U"}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    {detailUser.name}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {detailUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailUser(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <DetailRow label="ID" value={detailUser.id} />
              <DetailRow label="Name" value={detailUser.name} />
              <DetailRow label="Email" value={detailUser.email} />
              <DetailRow label="Role" value={detailUser.roleLabel} badge />
              <DetailRow label="Organization" value={detailUser.org} />
              <DetailRow label="Status" value={detailUser.status} status />
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setDetailUser(null)}
                className="w-full py-2.5 rounded-lg border border-white/8 bg-[#090a0f] text-xs text-slate-300 font-semibold hover:text-white hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== Remove Confirm =============== */}
      <ConfirmDialog
        open={!!removeTarget}
        title="Remove User"
        message={`Are you sure you want to remove "${removeTarget?.name}" from their organization? This action cannot be undone.`}
        confirmLabel="Remove User"
        loading={removeLoading}
        onConfirm={handleRemoveUser}
        onCancel={() => setRemoveTarget(null)}
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

const DetailRow = ({ label, value, badge, status }) => (
  <div className="flex items-center justify-between gap-4 py-2 border-b border-white/4 last:border-none">
    <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
      {label}
    </span>

    {badge ? (
      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20">
        {value}
      </span>
    ) : status ? (
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
          value === "Active"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : value === "Pending"
            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }`}
      >
        {value}
      </span>
    ) : (
      <span className="text-xs text-white">{value ?? "—"}</span>
    )}
  </div>
);

export default SuperAdminUsers;
