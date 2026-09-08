import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaServer, FaDatabase, FaMicrochip, FaCheckCircle } from "react-icons/fa";

const SuperAdminSystemHealth = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Infrastructure
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">System Health & Diagnostics</h1>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm">Monitor server load, database latency, and cluster uptime.</p>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <FaCheckCircle size={16} />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-400 text-xs sm:text-sm">All Infrastructure Nodes Operational</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Uptime: 99.98% over the last 30 days. No critical incidents reported.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <FaServer size={16} />
              </div>
              <h3 className="font-semibold text-white text-sm">API Server Cluster</h3>
              <p className="text-2xl font-bold mt-2 font-mono text-white">18.4%</p>
              <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">Healthy (Ping: 24ms)</span>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <FaDatabase size={16} />
              </div>
              <h3 className="font-semibold text-white text-sm">PostgreSQL Database</h3>
              <p className="text-2xl font-bold mt-2 font-mono text-white">42.1%</p>
              <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">Healthy (Ping: 12ms)</span>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <FaMicrochip size={16} />
              </div>
              <h3 className="font-semibold text-white text-sm">AI Proctoring Engine</h3>
              <p className="text-2xl font-bold mt-2 font-mono text-white">84.9%</p>
              <span className="text-xs text-amber-400 font-medium mt-1 inline-block">Optimal Load (Ping: 45ms)</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSystemHealth;