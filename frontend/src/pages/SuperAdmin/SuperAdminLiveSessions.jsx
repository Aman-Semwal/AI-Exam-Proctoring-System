import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaVideo, FaExclamationTriangle, FaUserShield, FaDesktop } from "react-icons/fa";

const SuperAdminLiveSessions = () => {
  const sessions = [
    { id: 1, student: "Rahul Sharma", exam: "Advanced React Assessment", org: "MM University", proctor: "Dr. A. Verma", status: "Active", risk: "Low" },
    { id: 2, student: "Priya Singh", exam: "Data Structures Final", org: "Tech Institute", proctor: "Auto AI Bot", status: "Flagged", risk: "High" },
    { id: 3, student: "Amit Kumar", exam: "Cloud Architecture", org: "Global Academy", proctor: "Sarah Jenkins", status: "Active", risk: "Medium" }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Live AI Monitoring & Sessions</h1>
              <p className="text-gray-400 mt-1 text-sm">Real-time surveillance feeds and proctored examination streams.</p>
            </div>
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-semibold text-red-400">18 Active Live Streams</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((s) => (
              <div key={s.id} className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <FaDesktop />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{s.student}</h3>
                      <p className="text-xs text-gray-400">{s.org}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    s.risk === "High" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                    s.risk === "Medium" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                    "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}>
                    Risk: {s.risk}
                  </span>
                </div>

                <div className="relative w-full h-44 bg-slate-950 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center mb-4">
                  <FaVideo className="text-slate-800 text-3xl animate-pulse" />
                  <div className="absolute bottom-3 left-3 text-xs text-gray-300 font-mono">Exam: {s.exam}</div>
                  {s.risk === "High" && (
                    <div className="absolute top-3 right-3 bg-red-600/90 text-white px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 font-semibold">
                      <FaExclamationTriangle /> Suspicious Activity
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1.5"><FaUserShield className="text-cyan-400" /> {s.proctor}</span>
                  <button className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 font-medium transition">Inspect</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLiveSessions;