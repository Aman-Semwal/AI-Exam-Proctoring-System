import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaFileAlt, FaSearch, FaEllipsisV } from "react-icons/fa";

const SuperAdminExams = () => {
  const exams = [
    { id: 1, title: "Advanced React & Redux Assessment", code: "CS-401", org: "MM University", duration: "90 mins", status: "Live" },
    { id: 2, title: "Data Structures Final Exam", code: "CS-202", org: "Tech Institute", duration: "120 mins", status: "Live" },
    { id: 3, title: "Cloud Architecture Midterm", code: "IT-305", org: "Global Academy", duration: "60 mins", status: "Scheduled" },
    { id: 4, title: "Database Systems Quiz", code: "CS-303", org: "Future College", duration: "45 mins", status: "Completed" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Platform Examinations</h1>
            <p className="text-gray-400 mt-1 text-sm">Oversee all active, scheduled, and completed assessments across organizations.</p>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm" />
                <input type="text" placeholder="Search exams by title or code..." className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-gray-400 font-semibold uppercase tracking-wider">
                    <th className="pb-4">Exam Title</th>
                    <th className="pb-4">Code</th>
                    <th className="pb-4">Organization</th>
                    <th className="pb-4">Duration</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exams.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-4 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold text-xs">
                          <FaFileAlt />
                        </div>
                        {e.title}
                      </td>
                      <td className="py-4 font-mono text-xs text-cyan-400">{e.code}</td>
                      <td className="py-4 text-gray-300 text-sm">{e.org}</td>
                      <td className="py-4 text-gray-400 text-sm">{e.duration}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          e.status === "Live" ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse" :
                          e.status === "Scheduled" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}>
                          {e.status}
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

export default SuperAdminExams;