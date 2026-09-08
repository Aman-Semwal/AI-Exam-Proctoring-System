import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Platform Overview
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Super Admin Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage organizations, users, exams and live platform surveillance.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Organizations"
              value="48"
              change="+8% this month"
              color="text-purple-400"
            />
            <StatCard
              title="Total Users"
              value="12,840"
              change="+12% this month"
              color="text-emerald-400"
            />
            <StatCard
              title="Active Exams"
              value="126"
              change="18 currently live"
              color="text-blue-400"
            />
            <StatCard
              title="Live Sessions"
              value="18"
              change="Streams active"
              color="text-amber-400"
            />
          </div>

          {/* Main Sections */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* System Health */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  System Health
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                  All Systems Operational
                </span>
              </div>

              <div className="space-y-4">
                <HealthBar
                  title="API Server Cluster"
                  value="92%"
                  width="92%"
                  status="Healthy"
                />
                <HealthBar
                  title="Database Instance"
                  value="96%"
                  width="96%"
                  status="Healthy"
                />
                <HealthBar
                  title="AI Proctoring Engine"
                  value="89%"
                  width="89%"
                  status="Operational"
                />
              </div>
            </div>

            {/* Platform Activity */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Platform Activity
                </h2>
                <span className="text-xs text-slate-400 font-mono">Live Feed</span>
              </div>

              <div className="space-y-3.5">
                <Activity
                  title="New organization registered"
                  time="12 minutes ago"
                  badge="+1 Org"
                />
                <Activity
                  title="CS401 exam paper published"
                  time="35 minutes ago"
                  badge="Exam"
                />
                <Activity
                  title="24 new candidates verified"
                  time="1 hour ago"
                  badge="Users"
                />
                <Activity
                  title="System backup completed"
                  time="2 hours ago"
                  badge="Done"
                />
              </div>
            </div>
          </div>

          {/* Recent Organizations Table */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Recent Organizations
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  Recently onboarded colleges & academic institutions
                </p>
              </div>
              <button className="text-purple-400 hover:text-purple-300 text-xs font-medium self-start sm:self-auto">
                View All Institutions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Organization</th>
                    <th className="pb-3">Users</th>
                    <th className="pb-3">Exams</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <Organization name="MM University" users="2,840" exams="48" />
                  <Organization name="Tech Institute" users="1,920" exams="32" />
                  <Organization name="Future College" users="1,245" exams="21" />
                  <Organization name="Global Academy" users="890" exams="15" />
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ---------------- Subcomponents ---------------- */

const StatCard = ({ title, value, change, color }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</p>
      <h2 className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight ${color}`}>{value}</h2>
      <p className="text-slate-400 text-[11px] mt-1">{change}</p>
    </div>
  );
};

const HealthBar = ({ title, value, width, status }) => {
  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-slate-300 font-medium">{title}</span>
        <span className="text-emerald-400 font-mono text-[11px]">{status} ({value})</span>
      </div>
      <div className="h-1.5 bg-[#090a0f] border border-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-purple-500 rounded-full" style={{ width }} />
      </div>
    </div>
  );
};

const Activity = ({ title, time, badge }) => {
  return (
    <div className="flex items-center justify-between gap-3 text-xs pb-3 border-b border-white/[0.04] last:border-none last:pb-0">
      <div>
        <p className="text-slate-200 font-medium">{title}</p>
        <p className="text-slate-400 text-[11px] mt-0.5 font-mono">{time}</p>
      </div>
      <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    </div>
  );
};

const Organization = ({ name, users, exams }) => {
  return (
    <tr className="hover:bg-white/[0.02] transition text-xs">
      <td className="py-3.5 font-semibold text-white">{name}</td>
      <td className="py-3.5 text-slate-300 font-mono">{users}</td>
      <td className="py-3.5 text-slate-300 font-mono">{exams}</td>
      <td className="py-3.5 text-right">
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
          Active
        </span>
      </td>
    </tr>
  );
};

export default SuperAdminDashboard;