import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import PerformanceChart from "../../components/charts/PerformanceChart";
import CircularProgress from "../../components/dashboard/CircularProgress";
import AIStatusCard from "../../components/dashboard/AIStatusCard";
import CalendarWidget from "../../components/dashboard/CalendarWidget";
import RecentActivity from "../../components/dashboard/RecentActivity";
import { FaBook, FaCheckCircle, FaClock, FaStar, FaSearch } from "react-icons/fa";

// ── Reusable theme-aware stat card ──────────────────────────
const StatCard = ({ title, value, accent }) => (
  <div className="card p-5">
    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</p>
    <p className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight" style={{ color: accent || "var(--text-primary)" }}>{value}</p>
  </div>
);

const initialResults = [
  { id: 1, exam: "B.Tech CSE — Data Structures", score: "88/100", grade: "A+", status: "Passed", date: "10 Aug 2026" },
  { id: 2, exam: "B.Tech CSE — Operating Systems", score: "76/100", grade: "B+", status: "Passed", date: "02 Aug 2026" },
  { id: 3, exam: "B.Tech CSE — Computer Networks", score: "64/100", grade: "C+", status: "Passed", date: "25 Jul 2026" },
];

export default function StudentDashboard() {
  const [search, setSearch] = useState("");
  const filtered = initialResults.filter(
    (r) => r.exam.toLowerCase().includes(search.toLowerCase()) || r.grade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title="Student Dashboard" breadcrumb="Student Portal" />

        <main className="p-6 lg:p-8 space-y-7 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                Good Morning, Priya 👋
              </h2>
              <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--text-secondary)" }}>
                Welcome to your student portal. Check your upcoming assessments and performance.
              </p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition shadow-sm shadow-blue-500/20 active:scale-[0.97] w-fit">
              Take Active Exam
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Exams"   value="12"  accent="#3b82f6" />
            <StatCard title="Completed"     value="8"   accent="#10b981" />
            <StatCard title="Upcoming"      value="4"   accent="#f59e0b" />
            <StatCard title="Average Score" value="91%" accent="#8b5cf6" />
          </div>

          {/* Analytics row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { Icon: FaBook,         label: "Subjects",   val: "6",      color: "#3b82f6" },
              { Icon: FaCheckCircle,  label: "Passed",     val: "6",      color: "#10b981" },
              { Icon: FaClock,        label: "Study Hrs",  val: "124 hrs",color: "#f59e0b" },
              { Icon: FaStar,         label: "Class Rank", val: "#12",    color: "#8b5cf6" },
            ].map(({ Icon, label, val, color }) => (
              <div key={label} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}>
                    <Icon size={13} />
                  </div>
                </div>
                <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><PerformanceChart /></div>
            <CircularProgress percentage={91} />
          </div>

          {/* AI Status + Calendar */}
          <div className="grid lg:grid-cols-2 gap-6">
            <AIStatusCard />
            <CalendarWidget />
          </div>

          {/* Upcoming Exams + Results */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upcoming */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Upcoming Exams</h3>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>2 Scheduled</span>
              </div>
              <div className="space-y-3">
                {[
                  { sub: "Artificial Intelligence", date: "20 Aug 2026", time: "09:00 AM" },
                  { sub: "Database Management",     date: "25 Aug 2026", time: "10:30 AM" },
                ].map((e) => (
                  <div key={e.sub} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{e.sub}</p>
                      <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-medium">Upcoming</span>
                    </div>
                    <p className="text-[11px] mt-1.5 font-mono" style={{ color: "var(--text-muted)" }}>
                      {e.date} · {e.time}
                    </p>
                    <button className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg text-xs font-semibold transition">
                      Start Exam
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Recent Results</h3>
                <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Latest 3</span>
              </div>
              <div className="space-y-3">
                {[
                  { sub: "Operating System",      marks: "92%", grade: "A" },
                  { sub: "Computer Networks",     marks: "88%", grade: "B+" },
                  { sub: "Software Engineering",  marks: "95%", grade: "A+" },
                ].map((r) => (
                  <div key={r.sub} className="card p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>{r.sub}</p>
                      <span className="badge-active px-2 py-0.5 rounded-full text-[10px] font-medium">Passed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Score</p>
                        <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{r.marks}</p>
                      </div>
                      <div>
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Grade</p>
                        <p className="text-sm font-bold text-blue-500">{r.grade}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Searchable Results Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Result Archives</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Historical examination performance records</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-full sm:w-72"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <FaSearch size={11} style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Search by exam or grade..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
            </div>

            <div className="card overflow-hidden">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-raised)" }}>
                    {["Examination", "Score", "Grade", "Date", "Status"].map((h) => (
                      <th key={h} className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map((r) => (
                    <tr key={r.id} className="table-row-hover transition"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-3 px-4 text-xs font-medium" style={{ color: "var(--text-primary)" }}>{r.exam}</td>
                      <td className="py-3 px-4 text-xs font-mono font-bold text-blue-500">{r.score}</td>
                      <td className="py-3 px-4 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{r.grade}</td>
                      <td className="py-3 px-4 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{r.date}</td>
                      <td className="py-3 px-4">
                        <span className="badge-active px-2.5 py-0.5 rounded-full text-[10px] font-medium">{r.status}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
                        No records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </main>
      </div>
    </div>
  );
}