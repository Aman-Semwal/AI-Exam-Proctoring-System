import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminAnalytics = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Analytics & Telemetry
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Platform Analytics</h1>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm">Deep insights, growth metrics, and comprehensive utilization reports.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Growth</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">+24.8%</h2>
              <p className="text-xs text-emerald-400 mt-1">vs last month</p>
            </div>
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Institutions</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">48</h2>
              <p className="text-xs text-purple-400 mt-1">+3 onboarded</p>
            </div>
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Exams Conducted</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">1,420</h2>
              <p className="text-xs text-blue-400 mt-1">Global total</p>
            </div>
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Average Pass Rate</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">84.2%</h2>
              <p className="text-xs text-emerald-400 mt-1">+2.4% rise</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;