import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaPlus,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaEye,
  FaUsers,
} from "react-icons/fa";
import api from "../../services/api";
import ActionDropdown from "../../components/common/ActionDropdown";
import Toast from "../../components/common/Toast";

const SuperAdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Register modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "",
    slug: "",
    plan: "FREE",
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Detail modal
  const [detailOrg, setDetailOrg] = useState(null);

  // Members modal
  const [membersOrg, setMembersOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  /* ===================== Auto slug ===================== */

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value) => {
    setRegisterForm((prev) => ({
      ...prev,
      name: value,
      slug: slugManuallyEdited ? prev.slug : generateSlug(value),
    }));
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    setRegisterForm((prev) => ({ ...prev, slug: value }));
  };

  /* ===================== Fetch orgs ===================== */

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError("");

      const [orgResponse, examResponse] = await Promise.all([
        api.get("/organizations"),
        api.get("/exams"),
      ]);

      const orgData = orgResponse.data?.data ?? orgResponse.data;
      const examData = examResponse.data?.data ?? examResponse.data;

      const orgList = Array.isArray(orgData)
        ? orgData
        : Array.isArray(orgData?.content)
        ? orgData.content
        : Array.isArray(orgData?.organizations)
        ? orgData.organizations
        : [];

      const examList = Array.isArray(examData)
        ? examData
        : Array.isArray(examData?.content)
        ? examData.content
        : Array.isArray(examData?.exams)
        ? examData.exams
        : [];

      const enrichedOrganizations = await Promise.all(
        orgList.map(async (org) => {
          let members = [];

          try {
            const memberResponse = await api.get(
              `/organizations/${org.id}/members`
            );

            const memberData =
              memberResponse.data?.data ?? memberResponse.data;

            members = Array.isArray(memberData)
              ? memberData
              : Array.isArray(memberData?.content)
              ? memberData.content
              : Array.isArray(memberData?.members)
              ? memberData.members
              : [];
          } catch (memberError) {
            console.warn(
              `Could not load members for organization ${org.id}`,
              memberError
            );
          }

          const students = members.filter(
            (member) => member.role === "STUDENT"
          ).length;

          const orgExams = examList.filter((exam) => {
            const examOrgId =
              exam.orgId ??
              exam.organizationId ??
              exam.organization?.id;

            return String(examOrgId) === String(org.id);
          }).length;

          const rawStatus =
            org.status ??
            org.organizationStatus ??
            org.state ??
            (org.isActive === false ? "INACTIVE" : "ACTIVE");

          const status =
            String(rawStatus).toUpperCase() === "PENDING"
              ? "Pending"
              : String(rawStatus).toUpperCase() === "ACTIVE" ||
                String(rawStatus).toUpperCase() === "APPROVED"
              ? "Active"
              : String(rawStatus).toUpperCase() === "INACTIVE" ||
                String(rawStatus).toUpperCase() === "DISABLED"
              ? "Inactive"
              : String(rawStatus)
                  .toLowerCase()
                  .replace(/^./, (char) => char.toUpperCase());

          return {
            id: org.id,
            name:
              org.name ??
              org.organizationName ??
              org.institutionName ??
              "Unnamed Organization",
            code:
              org.slug ??
              org.code ??
              org.organizationCode ??
              `ORG-${org.id}`,
            email:
              org.email ??
              org.adminEmail ??
              org.contactEmail ??
              "N/A",
            plan: org.plan ?? "FREE",
            students:
              org.studentCount ??
              org.studentsCount ??
              students,
            exams:
              org.examCount ??
              org.examsCount ??
              orgExams,
            status,
            isActive: org.isActive !== false,
          };
        })
      );

      setOrganizations(enrichedOrganizations);
    } catch (err) {
      console.error("Failed to load organizations:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load organizations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  /* ===================== Register org ===================== */

  const validateRegisterForm = () => {
    const errors = {};

    if (!registerForm.name.trim()) {
      errors.name = "Organization name is required";
    }

    if (!registerForm.slug.trim()) {
      errors.slug = "Slug is required";
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(registerForm.slug)) {
      errors.slug = "Slug must be lowercase words separated by hyphens (e.g. mit-eecs)";
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateRegisterForm()) return;

    try {
      setRegisterLoading(true);

      await api.post("/organizations", {
        name: registerForm.name.trim(),
        slug: registerForm.slug.trim(),
        plan: registerForm.plan || "FREE",
      });

      setShowRegisterModal(false);
      setRegisterForm({ name: "", slug: "", plan: "FREE" });
      setRegisterErrors({});
      setSlugManuallyEdited(false);
      setToast({ message: "Organization registered successfully!", type: "success" });
      fetchOrganizations();
    } catch (err) {
      console.error("Failed to register organization:", err);

      const apiErrors = err.response?.data?.data;
      if (apiErrors && typeof apiErrors === "object") {
        setRegisterErrors(apiErrors);
      } else {
        setRegisterErrors({
          general:
            err.response?.data?.message ||
            "Failed to register organization. Please try again.",
        });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const closeRegisterModal = () => {
    if (registerLoading) return;
    setShowRegisterModal(false);
    setRegisterForm({ name: "", slug: "", plan: "FREE" });
    setRegisterErrors({});
    setSlugManuallyEdited(false);
  };

  /* ===================== View details ===================== */

  const handleViewDetails = async (org) => {
    try {
      const response = await api.get(`/organizations/${org.id}`);
      const data = response.data?.data ?? response.data;
      setDetailOrg({ ...org, ...data });
    } catch {
      setDetailOrg(org);
    }
  };

  /* ===================== View members ===================== */

  const handleViewMembers = async (org) => {
    setMembersOrg(org);
    setMembersLoading(true);
    setMembers([]);

    try {
      const response = await api.get(`/organizations/${org.id}/members`);
      const data = response.data?.data ?? response.data;

      const memberList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];

      setMembers(memberList);
    } catch (err) {
      console.error("Failed to load members:", err);
      setToast({ message: "Failed to load organization members.", type: "error" });
    } finally {
      setMembersLoading(false);
    }
  };

  /* ===================== Filter ===================== */

  const filtered = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return organizations;

    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(search) ||
        org.code.toLowerCase().includes(search) ||
        org.email.toLowerCase().includes(search)
    );
  }, [organizations, searchTerm]);

  /* ===================== ROLE LABEL ===================== */

  const ROLE_LABEL = {
    STUDENT: "Student",
    EXAM_CREATOR: "Examiner",
    PROCTOR: "Proctor",
    ORG_ADMIN: "Org Admin",
    SUPER_ADMIN: "Super Admin",
  };

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
                Management
              </span>

              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Organizations Management
              </h1>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Approve, monitor, and manage registered educational institutes
                and colleges.
              </p>
            </div>

            <button
              onClick={() => setShowRegisterModal(true)}
              className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 text-xs transition shadow-sm active:scale-[0.98] w-fit"
            >
              <FaPlus size={11} />
              Register Organization
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-red-300">{error}</p>

              <button
                onClick={fetchOrganizations}
                className="text-xs font-semibold text-red-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search by name, code or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/8 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Total: {filtered.length} Institutions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-187.5 text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/6 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Institution Name</th>
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Admin Email</th>
                    <th className="pb-3 px-3">Students</th>
                    <th className="pb-3 px-3">Exams</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/4 text-xs">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-400"
                      >
                        Loading organizations...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="py-12 text-center text-slate-500"
                      >
                        No organizations found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((org) => (
                      <tr
                        key={org.id}
                        className="hover:bg-white/2 transition"
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                              {org.name?.[0]?.toUpperCase() || "O"}
                            </div>

                            <span>{org.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-purple-400">
                          {org.code}
                        </td>

                        <td className="py-3 px-3 text-slate-400">
                          {org.email}
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {Number(org.students || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-mono">
                          {Number(org.exams || 0).toLocaleString()}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-fit border ${
                              org.status === "Active"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : org.status === "Inactive"
                                ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            {org.status === "Active" ? (
                              <FaCheckCircle size={9} />
                            ) : (
                              <FaClock size={9} />
                            )}

                            {org.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <ActionDropdown
                            actions={[
                              {
                                label: "View Details",
                                icon: FaEye,
                                onClick: () => handleViewDetails(org),
                              },
                              {
                                label: "View Members",
                                icon: FaUsers,
                                onClick: () => handleViewMembers(org),
                              },
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

      {/* =============== Register Organization Modal =============== */}
      {showRegisterModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRegisterModal();
          }}
        >
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Register Organization
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add a new educational institution to the platform.
                </p>
              </div>

              <button
                onClick={closeRegisterModal}
                disabled={registerLoading}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white disabled:opacity-50"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* General error */}
              {registerErrors.general && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <p className="text-xs text-red-300">{registerErrors.general}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Organization Name <span className="text-rose-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. MIT EECS Department"
                  value={registerForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={registerLoading}
                  className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition disabled:opacity-50 ${
                    registerErrors.name
                      ? "border-rose-500/40 focus:border-rose-500"
                      : "border-white/8 focus:border-purple-500"
                  }`}
                />

                {registerErrors.name && (
                  <p className="text-[10px] text-rose-400 mt-1">
                    {registerErrors.name}
                  </p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  URL Slug <span className="text-rose-400">*</span>
                </label>

                <input
                  type="text"
                  placeholder="e.g. mit-eecs"
                  value={registerForm.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={registerLoading}
                  className={`w-full bg-[#090a0f] border rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition font-mono disabled:opacity-50 ${
                    registerErrors.slug
                      ? "border-rose-500/40 focus:border-rose-500"
                      : "border-white/8 focus:border-purple-500"
                  }`}
                />

                <p className="text-[10px] text-slate-500 mt-1">
                  Lowercase words separated by hyphens. Auto-generated from name.
                </p>

                {registerErrors.slug && (
                  <p className="text-[10px] text-rose-400 mt-0.5">
                    {registerErrors.slug}
                  </p>
                )}
              </div>

              {/* Plan */}
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Subscription Plan
                </label>

                <select
                  value={registerForm.plan}
                  onChange={(e) =>
                    setRegisterForm((prev) => ({
                      ...prev,
                      plan: e.target.value,
                    }))
                  }
                  disabled={registerLoading}
                  className="w-full bg-[#090a0f] border border-white/8 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition disabled:opacity-50"
                >
                  <option value="FREE">Free</option>
                  <option value="PRO">Pro</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleRegister}
                disabled={registerLoading}
                className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {registerLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  "Register Organization"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== Organization Detail Modal =============== */}
      {detailOrg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailOrg(null);
          }}
        >
          <div className="w-full max-w-md bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
                  {detailOrg.name?.[0]?.toUpperCase() || "O"}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-white">
                    {detailOrg.name}
                  </h2>
                  <p className="text-[10px] text-purple-400 font-mono">
                    {detailOrg.slug ?? detailOrg.code}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDetailOrg(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <DetailRow label="ID" value={detailOrg.id} />
              <DetailRow label="Name" value={detailOrg.name} />
              <DetailRow label="Slug" value={detailOrg.slug ?? detailOrg.code} mono />
              <DetailRow label="Plan" value={detailOrg.plan ?? "FREE"} badge />
              <DetailRow label="Status" value={detailOrg.isActive !== false ? "Active" : "Inactive"} status />
              <DetailRow label="Students" value={detailOrg.students} />
              <DetailRow label="Exams" value={detailOrg.exams} />
              {detailOrg.createdAt && (
                <DetailRow
                  label="Created At"
                  value={new Date(detailOrg.createdAt).toLocaleString()}
                />
              )}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setDetailOrg(null)}
                className="w-full py-2.5 rounded-lg border border-white/8 bg-[#090a0f] text-xs text-slate-300 font-semibold hover:text-white hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============== Members Modal =============== */}
      {membersOrg && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMembersOrg(null);
          }}
        >
          <div className="w-full max-w-lg bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-white/6">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Members — {membersOrg.name}
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {membersLoading
                    ? "Loading..."
                    : `${members.length} members`}
                </p>
              </div>

              <button
                onClick={() => setMembersOrg(null)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5 max-h-80 overflow-y-auto">
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No members found in this organization.
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#090a0f] border border-white/6"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {member.name?.[0]?.toUpperCase() || "U"}
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-white">
                            {member.name || "Unknown"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {member.email || "N/A"}
                          </p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[10px] font-medium border border-purple-500/20">
                        {ROLE_LABEL[member.role] || member.role || "User"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setMembersOrg(null)}
                className="w-full py-2.5 rounded-lg border border-white/8 bg-[#090a0f] text-xs text-slate-300 font-semibold hover:text-white hover:bg-white/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

const DetailRow = ({ label, value, mono, badge, status }) => (
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
            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
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

export default SuperAdminOrganizations;
