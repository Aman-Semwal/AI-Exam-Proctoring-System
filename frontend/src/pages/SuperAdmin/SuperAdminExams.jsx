import { useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaFileAlt, FaSearch, FaEllipsisV } from "react-icons/fa";

const SuperAdminExams = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const exams = [
    { id: 1, title: "Advanced React & Redux Assessment", code: "CS-401", org: "MM University", duration: "90 mins", status: "Live" },
    { id: 2, title: "Data Structures Final Exam", code: "CS-202", org: "Tech Institute", duration: "120 mins", status: "Live" },
    { id: 3, title: "Cloud Architecture Midterm", code: "IT-305", org: "Global Academy", duration: "60 mins", status: "Scheduled" },
    { id: 4, title: "Database Systems Quiz", code: "CS-303", org: "Future College", duration: "45 mins", status: "Completed" }
  ];

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.org.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Examinations
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Platform Examinations</h1>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm">Oversee all active, scheduled, and completed assessments across organizations.</p>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search exams by title, code or org..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">Total: {filtered.length} Examinations</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Exam Title</th>
                    <th className="pb-3 px-3">Code</th>
                    <th className="pb-3 px-3">Organization</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-3 font-semibold text-white flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                          <FaFileAlt size={11} />
                        </div>
                        {e.title}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-purple-400">{e.code}</td>
                      <td className="py-3 px-3 text-slate-300">{e.org}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{e.duration}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          e.status === "Live" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          e.status === "Scheduled" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {e.status}
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

export default SuperAdminExams;