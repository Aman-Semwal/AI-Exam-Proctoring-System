import { useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaSearch, FaUserPlus, FaEllipsisV } from "react-icons/fa";

const SuperAdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const users = [
    { id: 1, name: "Aarav Sharma", email: "aarav@mmdu.edu", role: "Student", org: "MM University", status: "Active" },
    { id: 2, name: "Dr. Rakesh Mehta", email: "rakesh@tit.ac.in", role: "Examiner", org: "Tech Institute", status: "Active" },
    { id: 3, name: "Sarah Jenkins", email: "sarah@future.edu", role: "Proctor", org: "Future College", status: "Active" },
    { id: 4, name: "Vikram Malhotra", email: "vikram@global.org", role: "Org Admin", org: "Global Academy", status: "Active" },
    { id: 5, name: "Neha Gupta", email: "neha@mmdu.edu", role: "Student", org: "MM University", status: "Active" }
  ];

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Directory
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">User Directory</h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage all students, examiners, proctors, and organization admins across the platform.</p>
            </div>
            <button className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center gap-2 text-xs transition shadow-sm active:scale-[0.98] w-fit">
              <FaUserPlus size={11} /> Add New User
            </button>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search by user name, email or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">Total: {filtered.length} Users</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Full Name</th>
                    <th className="pb-3 px-3">Email Address</th>
                    <th className="pb-3 px-3">Role</th>
                    <th className="pb-3 px-3">Organization</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {u.name[0]}
                        </div>
                        {u.name}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 text-[11px] font-medium border border-purple-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{u.org}</td>
                      <td className="py-3 px-3">
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {u.status}
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

export default SuperAdminUsers;