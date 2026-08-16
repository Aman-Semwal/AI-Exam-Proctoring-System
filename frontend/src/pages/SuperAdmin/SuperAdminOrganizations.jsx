import { useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {  FaPlus, FaSearch, FaEllipsisV, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const SuperAdminOrganizations = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const organizations = [
    { id: 1, name: "MM University", code: "MMU-01", email: "admin@mmdu.edu", students: "3,450", exams: "24", status: "Active" },
    { id: 2, name: "Tech Institute of Technology", code: "TIT-02", email: "contact@tit.ac.in", students: "1,920", exams: "18", status: "Active" },
    { id: 3, name: "Global Academy of Sciences", code: "GAS-03", email: "info@global.org", students: "890", exams: "7", status: "Pending" },
    { id: 4, name: "Future College", code: "FC-04", email: "support@future.edu", students: "1,245", exams: "12", status: "Active" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      {/* Sidebar - Fix Fixed */}
      <SuperAdminSidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Organizations Management</h1>
              <p className="text-gray-400 mt-1 text-sm">Approve, monitor, and manage registered educational institutes and colleges.</p>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-cyan-500/25">
              <FaPlus /> Register Organization
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input 
                  type="text" 
                  placeholder="Search by name or code..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition" 
                />
              </div>
              <span className="text-xs text-gray-400 font-mono">Total: {organizations.length} Institutions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-4">Institution Name</th>
                    <th className="pb-4">Code</th>
                    <th className="pb-4">Admin Email</th>
                    <th className="pb-4">Students</th>
                    <th className="pb-4">Exams</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {organizations.map((org) => (
                    <tr key={org.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 font-semibold text-white flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                          {org.name[0]}
                        </div>
                        {org.name}
                      </td>
                      <td className="py-4 font-mono text-xs text-cyan-400">{org.code}</td>
                      <td className="py-4 text-gray-400 text-sm">{org.email}</td>
                      <td className="py-4 text-gray-300">{org.students}</td>
                      <td className="py-4 text-gray-300">{org.exams}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 w-fit ${
                          org.status === "Active" 
                            ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                            : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {org.status === "Active" ? <FaCheckCircle className="text-[10px]" /> : <FaTimesCircle className="text-[10px]" />}
                          {org.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition">
                          <FaEllipsisV />
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