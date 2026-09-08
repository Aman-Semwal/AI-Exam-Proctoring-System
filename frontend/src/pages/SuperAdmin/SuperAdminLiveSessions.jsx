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
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Surveillance Grid
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Live AI Monitoring & Sessions</h1>
              <p className="text-slate-400 mt-1 text-xs sm:text-sm">Real-time surveillance feeds and proctored examination streams.</p>
            </div>
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-lg w-fit">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-semibold text-rose-400 font-mono">18 Live Streams</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sessions.map((s) => (
              <div key={s.id} className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FaDesktop size={12} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-xs">{s.student}</h3>
                      <p className="text-[10px] text-slate-400">{s.org}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    s.risk === "High" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    s.risk === "Medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  }`}>
                    Risk: {s.risk}
                  </span>
                </div>

                <div className="relative w-full h-36 bg-[#090a0f] rounded-lg overflow-hidden border border-white/[0.06] flex items-center justify-center mb-3">
                  <FaVideo className="text-slate-800 text-2xl animate-pulse" />
                  <div className="absolute bottom-2.5 left-2.5 text-[10px] text-slate-300 font-mono bg-black/60 px-1.5 py-0.5 rounded">
                    Exam: {s.exam}
                  </div>
                  {s.risk === "High" && (
                    <div className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-semibold">
                      <FaExclamationTriangle size={10} /> Suspicious
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
                  <span className="flex items-center gap-1.5 text-[11px]"><FaUserShield className="text-blue-400" size={11} /> {s.proctor}</span>
                  <button className="px-2.5 py-1 rounded bg-[#090a0f] hover:bg-white/[0.05] border border-white/[0.08] text-blue-400 text-[11px] font-medium transition">
                    Inspect Feed
                  </button>
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