import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminAnalytics = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-gray-400 mt-1 text-sm">Deep insights, growth metrics, and comprehensive utilization reports.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <span className="text-xs text-gray-400">Total Growth</span>
              <h2 className="text-3xl font-bold text-white mt-2">+24.8%</h2>
              <p className="text-xs text-green-400 mt-1">vs last month</p>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <span className="text-xs text-gray-400">Active Institutions</span>
              <h2 className="text-3xl font-bold text-white mt-2">48</h2>
              <p className="text-xs text-cyan-400 mt-1">+3 onboarded</p>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <span className="text-xs text-gray-400">Exams Conducted</span>
              <h2 className="text-3xl font-bold text-white mt-2">1,420</h2>
              <p className="text-xs text-purple-400 mt-1">Global total</p>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl">
              <span className="text-xs text-gray-400">Average Pass Rate</span>
              <h2 className="text-3xl font-bold text-white mt-2">84.2%</h2>
              <p className="text-xs text-green-400 mt-1">+2.4% rise</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;