import { useState } from "react";
import { FaShieldAlt, FaSearch, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const initialIncidents = [
  { id: 1, student: "Rahul Verma", exam: "B.Tech CSE - Final Algorithm", issue: "Multiple faces detected", time: "10:15 AM", severity: "High" },
  { id: 2, student: "Priya Sharma", exam: "B.Tech CSE - Final Algorithm", issue: "Tab switch out of browser", time: "10:22 AM", severity: "Medium" },
  { id: 3, student: "Ananya Gupta", exam: "B.Tech ECE - Microprocessors", issue: "No face detected in frame", time: "10:35 AM", severity: "High" },
];

export default function ProctorDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents] = useState(initialIncidents);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const filteredIncidents = incidents.filter(
    (item) =>
      item.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issue.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* Sidebar for Proctor Section */}
      <aside className="w-64 min-h-screen bg-[#0d0f17] border-r border-white/[0.07] flex flex-col justify-between p-4 shrink-0 sticky top-0 h-screen">
        <div>
          <div className="p-3 mb-4 cursor-pointer flex items-center gap-3 group" onClick={() => navigate("/proctor/dashboard")}>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaShieldAlt size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Proctor<span className="text-blue-400">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Invigilator Command</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
              Surveillance
            </p>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold text-xs shadow-sm">
              <FaShieldAlt size={14} />
              <span>Control Center</span>
            </div>
          </nav>
        </div>

        <div className="pt-3 border-t border-white/[0.07]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-2 rounded-lg transition"
          >
            <FaSignOutAlt size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Surveillance Room</span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Proctor Control Center</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Live monitoring, anomaly alerts, and student behavior tracking.</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Shift Monitoring
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Live Exams</p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">03</p>
          </div>
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Active Students</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2 font-mono">300</p>
          </div>
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Pending Alerts</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono">02</p>
          </div>
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Violations Flagged</p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono">03</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 w-full sm:w-80">
              <FaSearch className="text-slate-500 text-xs mr-2.5" />
              <input
                type="text"
                placeholder="Search incidents by candidate, exam, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Recorded Alerts: <span className="font-semibold text-white">{filteredIncidents.length}</span>
            </div>
          </div>

          {/* Incidents / Violations Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Student Name</th>
                  <th className="pb-3 px-3">Exam Context</th>
                  <th className="pb-3 px-3">Violation / Issue</th>
                  <th className="pb-3 px-3">Timestamp</th>
                  <th className="pb-3 px-3">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-3 font-semibold text-white">{item.student}</td>
                      <td className="py-3.5 px-3 text-slate-300">{item.exam}</td>
                      <td className="py-3.5 px-3 text-slate-200 font-medium">{item.issue}</td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">{item.time}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            item.severity === "High"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 text-xs">
                      No violations or alerts found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}