import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaSearch, FaUserPlus, FaEllipsisV } from "react-icons/fa";

const SuperAdminUsers = () => {
  const users = [
    { id: 1, name: "Aarav Sharma", email: "aarav@mmdu.edu", role: "Student", org: "MM University", status: "Active" },
    { id: 2, name: "Dr. Rakesh Mehta", email: "rakesh@tit.ac.in", role: "Examiner", org: "Tech Institute", status: "Active" },
    { id: 3, name: "Sarah Jenkins", email: "sarah@future.edu", role: "Proctor", org: "Future College", status: "Active" },
    { id: 4, name: "Vikram Malhotra", email: "vikram@global.org", role: "Org Admin", org: "Global Academy", status: "Active" },
    { id: 5, name: "Neha Gupta", email: "neha@mmdu.edu", role: "Student", org: "MM University", status: "Active" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Directory</h1>
              <p className="text-gray-400 mt-1 text-sm">Manage all students, examiners, proctors, and organization admins across the platform.</p>
            </div>
            <button className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-2 text-sm transition shadow-lg shadow-cyan-500/25">
              <FaUserPlus /> Add New User
            </button>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="text" placeholder="Search by user name or email..." className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-4">Full Name</th>
                    <th className="pb-4">Email Address</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Organization</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {u.name[0]}
                        </div>
                        {u.name}
                      </td>
                      <td className="py-4 text-gray-400 text-sm">{u.email}</td>
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300 text-sm">{u.org}</td>
                      <td className="py-4">
                        <span className="text-green-400 text-xs font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> {u.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition"><FaEllipsisV /></button>
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