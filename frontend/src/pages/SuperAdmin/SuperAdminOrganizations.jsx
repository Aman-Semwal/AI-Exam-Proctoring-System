import { useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaPlus, FaSearch, FaEllipsisV, FaCheckCircle, FaClock } from "react-icons/fa";

const SuperAdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const organizations = [
    { id: 1, name: "MM University", code: "MMU-01", email: "admin@mmdu.edu", students: "3,450", exams: "24", status: "Active" },
    { id: 2, name: "Tech Institute of Technology", code: "TIT-02", email: "contact@tit.ac.in", students: "1,920", exams: "18", status: "Active" },
    { id: 3, name: "Global Academy of Sciences", code: "GAS-03", email: "info@global.org", students: "890", exams: "7", status: "Pending" },
    { id: 4, name: "Future College", code: "FC-04", email: "support@future.edu", students: "1,245", exams: "12", status: "Active" }
  ];

  const filtered = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                Approve, monitor, and manage registered educational institutes and colleges.
              </p>
            </div>
            <button className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 text-xs transition shadow-sm active:scale-[0.98] w-fit">
              <FaPlus size={11} /> Register Organization
            </button>
          </div>

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
              <span className="text-xs text-slate-400 font-mono">Total: {filtered.length} Institutions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
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
                  {filtered.map((org) => (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
                          {org.name[0]}
                        </div>
                        {org.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-purple-400">{org.code}</td>
                      <td className="py-3 px-3 text-slate-400">{org.email}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{org.students}</td>
                      <td className="py-3 px-3 text-slate-300 font-mono">{org.exams}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 w-fit border ${
                          org.status === "Active" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {org.status === "Active" ? <FaCheckCircle size={9} /> : <FaClock size={9} />}
                          {org.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button className="p-1.5 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white transition">
                          <FaEllipsisV size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminOrganizations;