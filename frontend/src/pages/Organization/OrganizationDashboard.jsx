import {
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaFileAlt,
  FaArrowUp,
} from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { useNavigate } from "react-router-dom";

const OrganizationDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      {/* Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Organization Dashboard
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage your organization and examination activities
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                Anchal Saini
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Organization Admin
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Welcome Header */}
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Overview
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Welcome back, Anchal
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Here's what's happening in your organization today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value="1,248"
              icon={<FaUsers size={16} />}
              change="+12%"
            />
            <StatCard
              title="Examiners"
              value="32"
              icon={<FaUserTie size={16} />}
              change="+4%"
            />
            <StatCard
              title="Proctors"
              value="18"
              icon={<FaUserShield size={16} />}
              change="+2%"
            />
            <StatCard
              title="Active Exams"
              value="08"
              icon={<FaFileAlt size={16} />}
              change="+8%"
            />
          </div>

          {/* Middle Section */}
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Upcoming Exams */}
            <div className="lg:col-span-2 bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Upcoming Exams
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Exams scheduled for your organization
                  </p>
                </div>

                <button 
                  onClick={() => navigate("/organization/upcoming-exams")}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                <ExamRow
                  title="Data Structures & Algorithms"
                  date="Today"
                  time="10:00 AM"
                  students="120 Students"
                />
                <ExamRow
                  title="Database Management System"
                  date="Tomorrow"
                  time="11:30 AM"
                  students="95 Students"
                />
                <ExamRow
                  title="Operating Systems"
                  date="05 Aug"
                  time="02:00 PM"
                  students="86 Students"
                />
                <ExamRow
                  title="Computer Networks"
                  date="08 Aug"
                  time="10:30 AM"
                  students="110 Students"
                />
              </div>
            </div>

            {/* Organization Overview */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Organization Overview
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current operational efficiency
              </p>

              <div className="mt-5 space-y-4">
                <ProgressItem
                  title="Student Engagement"
                  value="82%"
                  width="82%"
                />
                <ProgressItem
                  title="Exam Completion"
                  value="74%"
                  width="74%"
                />
                <ProgressItem
                  title="Proctor Availability"
                  value="91%"
                  width="91%"
                />
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight pb-3 mb-4 border-b border-white/[0.06]">
                Recent Activity
              </h3>

              <div className="space-y-3">
                <Activity text="45 new students registered" time="20 minutes ago" />
                <Activity text="Examiner created a new exam" time="1 hour ago" />
                <Activity text="Proctor assigned to DSA examination" time="2 hours ago" />
                <Activity text="Database exam results published" time="Yesterday" />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Quick Actions
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">
                Common administrative workflows
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => navigate("/organization/students")}
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUsers className="text-blue-400 text-sm mb-2" />
                  <p className="font-semibold text-white text-xs">Manage Students</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enrolled candidates</p>
                </button>

                <button 
                  onClick={() => navigate("/organization/examiners")}
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUserTie className="text-blue-400 text-sm mb-2" />
                  <p className="font-semibold text-white text-xs">Manage Examiners</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Faculty paper creators</p>
                </button>

                <button 
                  onClick={() => navigate("/organization/proctors")}
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUserShield className="text-blue-400 text-sm mb-2" />
                  <p className="font-semibold text-white text-xs">Manage Proctors</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Assign invigilators</p>
                </button>

                <button 
                  onClick={() => navigate("/organization/active-exams")}
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaFileAlt className="text-blue-400 text-sm mb-2" />
                  <p className="font-semibold text-white text-xs">View Exams</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Active examination grid</p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ================= SUBCOMPONENTS ================= */

const StatCard = ({ title, value, icon, change }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm hover:border-white/[0.15] transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold mt-2 text-white tracking-tight">{value}</h3>
        </div>

        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-[11px] text-emerald-400 font-medium">
        <FaArrowUp size={9} />
        {change}
        <span className="text-slate-400 ml-0.5">this month</span>
      </div>
    </div>
  );
};

const ExamRow = ({ title, date, time, students }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#090a0f] border border-white/[0.05] hover:border-white/[0.1] transition text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <FaFileAlt size={12} />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-white truncate">{title}</p>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">{students}</p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-medium text-white">{date}</p>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{time}</p>
      </div>
    </div>
  );
};

const ProgressItem = ({ title, value, width }) => {
  return (
    <div>
      <div className="flex justify-between mb-1.5 text-xs">
        <span className="text-slate-300 font-medium">{title}</span>
        <span className="font-semibold text-white font-mono">{value}</span>
      </div>

      <div className="h-1.5 bg-[#090a0f] border border-white/[0.06] rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width }} />
      </div>
    </div>
  );
};

const Activity = ({ text, time }) => {
  return (
    <div className="flex gap-2.5 items-start text-xs pb-2.5 border-b border-white/[0.04] last:border-none last:pb-0">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
      <div>
        <p className="font-medium text-slate-200">{text}</p>
        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{time}</p>
      </div>
    </div>
  );
};

export default OrganizationDashboard;