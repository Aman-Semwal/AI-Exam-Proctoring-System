import {
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaFileAlt,
  FaArrowUp,
} from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

const OrganizationDashboard = () => {
  return (
    <div className="flex min-h-screen bg-[#020617] text-white">

      {/* ================= SIDEBAR ================= */}
      <OrganizationSidebar />

      {/* ================= MAIN WRAPPER ================= */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ================= TOPBAR ================= */}
        <header className="h-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Organization Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your organization and examination activities
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">
                Anchal Saini
              </p>
              <p className="text-xs text-slate-400">
                Organization Admin
              </p>
            </div>
          </div>
        </header>


        {/* ================= MAIN CONTENT ================= */}
        <main className="p-6 lg:p-10 flex-1 overflow-y-auto">

          {/* Welcome */}
          <div className="mb-8">
            <p className="text-cyan-400 font-medium">
              Good Morning 👋
            </p>
            <h2 className="text-3xl font-bold mt-1 text-white">
              Welcome back, Anchal
            </h2>
            <p className="text-slate-400 mt-2">
              Here's what's happening in your organization today.
            </p>
          </div>


          {/* ================= STATS ================= */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Total Students"
              value="1,248"
              icon={<FaUsers />}
              change="+12%"
            />

            <StatCard
              title="Examiners"
              value="32"
              icon={<FaUserTie />}
              change="+4%"
            />

            <StatCard
              title="Proctors"
              value="18"
              icon={<FaUserShield />}
              change="+2%"
            />

            <StatCard
              title="Active Exams"
              value="08"
              icon={<FaFileAlt />}
              change="+8%"
            />
          </div>


          {/* ================= MIDDLE SECTION ================= */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">

            {/* Upcoming Exams */}
            <div className="lg:col-span-2 bg-slate-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Upcoming Exams
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">
                    Exams scheduled for your organization
                  </p>
                </div>

                <button className="text-sm text-cyan-400 font-medium hover:underline">
                  View All
                </button>
              </div>

              <div className="space-y-4">
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
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white">
                Organization Overview
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Current organization status
              </p>

              <div className="mt-7 space-y-6">
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


          {/* ================= BOTTOM SECTION ================= */}
          <div className="grid lg:grid-cols-2 gap-6 mt-8">

            {/* Recent Activity */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-5">
                Recent Activity
              </h3>

              <div className="space-y-5">
                <Activity
                  text="45 new students registered"
                  time="20 minutes ago"
                />

                <Activity
                  text="Examiner created a new exam"
                  time="1 hour ago"
                />

                <Activity
                  text="Proctor assigned to DSA examination"
                  time="2 hours ago"
                />

                <Activity
                  text="Database exam results published"
                  time="Yesterday"
                />
              </div>
            </div>


            {/* Quick Actions */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white">
                Quick Actions
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Common organization tasks
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                
                {/* Students */}
                <button className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left hover:bg-slate-800 transition">
                  <FaUsers className="text-cyan-400 text-xl mb-3" />
                  <p className="font-semibold text-white">
                    Manage Students
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    View and manage students
                  </p>
                </button>

                {/* Examiners */}
                <button className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left hover:bg-slate-800 transition">
                  <FaUserTie className="text-cyan-400 text-xl mb-3" />
                  <p className="font-semibold text-white">
                    Manage Examiners
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage exam creators
                  </p>
                </button>

                {/* Proctors */}
                <button className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left hover:bg-slate-800 transition">
                  <FaUserShield className="text-cyan-400 text-xl mb-3" />
                  <p className="font-semibold text-white">
                    Manage Proctors
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Assign examination proctors
                  </p>
                </button>

                {/* Exams */}
                <button className="p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left hover:bg-slate-800 transition">
                  <FaFileAlt className="text-cyan-400 text-xl mb-3" />
                  <p className="font-semibold text-white">
                    View Exams
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage organization exams
                  </p>
                </button>

              </div>
            </div>

          </div>

        </main>

      </div>
    </div>
  );
};


/* ================= STAT CARD ================= */

const StatCard = ({
  title,
  value,
  icon,
  change,
}) => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>
          <h3 className="text-3xl font-bold mt-2 text-white">
            {value}
          </h3>
        </div>

        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 text-cyan-400 flex items-center justify-center text-lg">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-4 text-sm text-emerald-400">
        <FaArrowUp />
        {change}
        <span className="text-slate-400 ml-1">
          this month
        </span>
      </div>
    </div>
  );
};


/* ================= EXAM ROW ================= */

const ExamRow = ({
  title,
  date,
  time,
  students,
}) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-800/40 border border-white/5 hover:bg-slate-800/80 transition">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-cyan-400">
          <FaFileAlt />
        </div>

        <div>
          <p className="font-semibold text-white">
            {title}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {students}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-sm font-medium text-white">
          {date}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {time}
        </p>
      </div>
    </div>
  );
};


/* ================= PROGRESS ================= */

const ProgressItem = ({
  title,
  value,
  width,
}) => {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-sm text-slate-300">
          {title}
        </span>
        <span className="text-sm font-semibold text-white">
          {value}
        </span>
      </div>

      <div className="h-2 bg-slate-800 border border-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-400 rounded-full shadow-sm shadow-cyan-400/50"
          style={{ width }}
        />
      </div>
    </div>
  );
};


/* ================= ACTIVITY ================= */

const Activity = ({
  text,
  time,
}) => {
  return (
    <div className="flex gap-3">
      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 shadow-sm shadow-cyan-400/50" />

      <div>
        <p className="text-sm font-medium text-slate-200">
          {text}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {time}
        </p>
      </div>
    </div>
  );
};


export default OrganizationDashboard;