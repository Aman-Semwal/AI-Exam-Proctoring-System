import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaServer, FaDatabase, FaMicrochip, FaCheckCircle } from "react-icons/fa";

const SuperAdminSystemHealth = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">System Health & Diagnostics</h1>
            <p className="text-gray-400 mt-1 text-sm">Monitor server load, database latency, and cluster uptime.</p>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-5 flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
              <FaCheckCircle />
            </div>
            <div>
              <h3 className="font-bold text-green-400 text-sm">All Infrastructure Nodes Operational</h3>
              <p className="text-xs text-gray-400 mt-0.5">Uptime: 99.98% over the last 30 days.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <FaServer className="text-cyan-400 text-2xl mb-3" />
              <h3 className="font-semibold text-white">API Server Cluster</h3>
              <p className="text-2xl font-bold mt-2">18.4%</p>
              <span className="text-xs text-green-400">Healthy (Ping: 24ms)</span>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <FaDatabase className="text-blue-400 text-2xl mb-3" />
              <h3 className="font-semibold text-white">PostgreSQL Database</h3>
              <p className="text-2xl font-bold mt-2">42.1%</p>
              <span className="text-xs text-green-400">Healthy (Ping: 12ms)</span>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <FaMicrochip className="text-purple-400 text-2xl mb-3" />
              <h3 className="font-semibold text-white">AI Proctoring Engine</h3>
              <p className="text-2xl font-bold mt-2">84.9%</p>
              <span className="text-xs text-yellow-400">Optimal Load (Ping: 45ms)</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default SuperAdminSystemHealth;