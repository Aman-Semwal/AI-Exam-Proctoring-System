import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminDashboard = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">

      <SuperAdminSidebar />

      <div className="flex-1 min-w-0">

        <SuperAdminTopbar />

        <main className="p-6 lg:p-8">

          {/* Header */}
          <div className="mb-8">
            <p className="text-cyan-400 font-medium">
              Platform Overview
            </p>

            <h1 className="text-3xl lg:text-4xl font-bold mt-2">
              Super Admin Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Manage organizations, users, exams and platform activity.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            <StatCard
              title="Organizations"
              value="48"
              change="+8% this month"
              color="cyan"
            />

            <StatCard
              title="Total Users"
              value="12,840"
              change="+12% this month"
              color="green"
            />

            <StatCard
              title="Active Exams"
              value="126"
              change="18 currently active"
              color="yellow"
            />

            <StatCard
              title="Live Sessions"
              value="18"
              change="Monitoring active"
              color="purple"
            />

          </div>

          {/* Main Sections */}
          <div className="grid xl:grid-cols-2 gap-6 mt-8">

            {/* System Health */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  System Health
                </h2>

                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                  All Systems Operational
                </span>
              </div>

              <div className="mt-7 space-y-6">

                <HealthBar
                  title="Server"
                  value="92%"
                  width="92%"
                  status="Healthy"
                />

                <HealthBar
                  title="Database"
                  value="96%"
                  width="96%"
                  status="Healthy"
                />

                <HealthBar
                  title="AI Services"
                  value="89%"
                  width="89%"
                  status="Operational"
                />

              </div>

            </div>

            {/* Platform Activity */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

              <h2 className="text-xl font-semibold">
                Platform Activity
              </h2>

              <div className="mt-6 space-y-5">

                <Activity
                  title="New organization registered"
                  time="12 minutes ago"
                  badge="+1"
                />

                <Activity
                  title="Exam published"
                  time="35 minutes ago"
                  badge="New"
                />

                <Activity
                  title="24 new users joined"
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

          {/* Recent Organizations */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 mt-6">

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

              <div>
                <h2 className="text-xl font-semibold">
                  Recent Organizations
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Recently registered organizations
                </p>
              </div>

              <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                View All
              </button>

            </div>

            <div className="overflow-x-auto mt-6">

              <table className="w-full min-w-[600px]">

                <thead>
                  <tr className="border-b border-white/10 text-left">

                    <th className="pb-4 text-gray-500 font-medium">
                      Organization
                    </th>

                    <th className="pb-4 text-gray-500 font-medium">
                      Users
                    </th>

                    <th className="pb-4 text-gray-500 font-medium">
                      Exams
                    </th>

                    <th className="pb-4 text-gray-500 font-medium">
                      Status
                    </th>

                  </tr>
                </thead>

                <tbody>

                  <Organization
                    name="MM University"
                    users="2,840"
                    exams="48"
                  />

                  <Organization
                    name="Tech Institute"
                    users="1,920"
                    exams="32"
                  />

                  <Organization
                    name="Future College"
                    users="1,245"
                    exams="21"
                  />

                  <Organization
                    name="Global Academy"
                    users="890"
                    exams="15"
                  />

                </tbody>

              </table>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
};

/* ---------------- Components ---------------- */

const StatCard = ({ title, value, change, color }) => {

  const colors = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-cyan-500/40 transition">

      <p className="text-gray-400">
        {title}
      </p>

      <h2 className={`text-3xl font-bold mt-3 ${colors[color]}`}>
        {value}
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        {change}
      </p>

    </div>
  );
};

const HealthBar = ({ title, value, width, status }) => {

  return (
    <div>

      <div className="flex justify-between mb-2">

        <span className="text-gray-400">
          {title}
        </span>

        <span className="text-green-400 text-sm">
          {status}
        </span>

      </div>

      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">

        <div
          className="h-2 bg-cyan-400 rounded-full"
          style={{ width }}
        />

      </div>

      <p className="text-gray-500 text-xs mt-2">
        Usage: {value}
      </p>

    </div>
  );
};

const Activity = ({ title, time, badge }) => {

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">

      <div>
        <p className="text-white">
          {title}
        </p>

        <p className="text-gray-500 text-sm mt-1">
          {time}
        </p>
      </div>

      <span className="text-cyan-400 text-sm">
        {badge}
      </span>

    </div>
  );
};

const Organization = ({ name, users, exams }) => {

  return (
    <tr className="border-b border-white/10">

      <td className="py-5 text-white font-medium">
        {name}
      </td>

      <td className="py-5 text-gray-400">
        {users}
      </td>

      <td className="py-5 text-gray-400">
        {exams}
      </td>

      <td className="py-5">
        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
          Active
        </span>
      </td>

    </tr>
  );
};

export default SuperAdminDashboard;