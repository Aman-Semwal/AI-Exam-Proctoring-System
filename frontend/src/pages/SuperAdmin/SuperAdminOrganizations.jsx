import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaPlus,
  FaSearch,
  FaEllipsisV,
  FaCheckCircle,
  FaClock,
  FaTimes,
} from "react-icons/fa";
import api from "../../services/api";

const SuperAdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
            "ACTIVE";

          const status =
            String(rawStatus).toUpperCase() === "PENDING"
              ? "Pending"
              : String(rawStatus).toUpperCase() === "ACTIVE" ||
                String(rawStatus).toUpperCase() === "APPROVED"
              ? "Active"
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
              org.code ??
              org.slug ??
              org.organizationCode ??
              `ORG-${org.id}`,
            email:
              org.email ??
              org.adminEmail ??
              org.contactEmail ??
              "N/A",
            students:
              org.studentCount ??
              org.studentsCount ??
              students,
            exams:
              org.examCount ??
              org.examsCount ??
              orgExams,
            status,
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

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
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
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search by name, code or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Total: {filtered.length} Institutions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Institution Name</th>
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Admin Email</th>
                    <th className="pb-3 px-3">Students</th>
                    <th className="pb-3 px-3">Exams</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
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
                        className="hover:bg-white/[0.02] transition"
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
                          <button
                            title="Organization actions"
                            className="p-1.5 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white transition"
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

      {/* Register Organization Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Register Organization
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Organization registration form can be connected here.
                </p>
              </div>

              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.05] text-slate-400 hover:text-white"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm text-slate-400 leading-relaxed">
                The backend already provides the organization creation API.
                We can connect the complete registration form after the
                remaining Super Admin pages are integrated.
              </p>

              <button
                onClick={() => setShowRegisterModal(false)}
                className="mt-5 w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminOrganizations;

