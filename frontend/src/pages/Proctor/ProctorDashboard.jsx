import { useState } from "react";
import { FaShieldAlt, FaSearch, FaSignOutAlt, } from "react-icons/fa";
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
    <div className="min-h-screen bg-[#020617] text-white flex">
      
      {/* Sidebar for Proctor Section */}
      <aside className="w-72 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col justify-between p-6">
        <div>
          <div className="mb-8 cursor-pointer" onClick={() => navigate("/proctor/dashboard")}>
            <h1 className="text-2xl font-bold text-white">
              Proctor<span className="text-cyan-400">Portal</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Live Exam Surveillance & Security</p>
          </div>

          <nav className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm shadow-md">
              <FaShieldAlt />
              Control Center
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white py-2.5 rounded-xl transition text-sm font-medium border border-rose-500/20"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Proctor Control Center</h1>
              <p className="text-sm text-slate-400">Live monitoring, anomaly alerts, and student behavior tracking.</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Active Shift Monitoring
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium">Live Exams Monitored</p>
              <p className="text-3xl font-bold text-white mt-2">03</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium">Active Students</p>
              <p className="text-3xl font-bold text-cyan-400 mt-2">300</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium">Pending Alerts</p>
              <p className="text-3xl font-bold text-amber-400 mt-2">02</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium">Critical Violations</p>
              <p className="text-3xl font-bold text-rose-400 mt-2">03</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 w-full md:w-96">
              <FaSearch className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Search incidents by student, exam, or issue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <div className="text-sm text-slate-400 hidden md:block">
              Recorded Alerts: <span className="font-semibold text-white">{filteredIncidents.length}</span>
            </div>
          </div>

          {/* Incidents / Violations Table */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Exam Context</th>
                  <th className="py-3 px-6">Violation / Issue</th>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Severity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredIncidents.length > 0 ? (
                  filteredIncidents.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-4 px-6 font-medium text-white">{item.student}</td>
                      <td className="py-4 px-6 text-sm text-slate-300">{item.exam}</td>
                      <td className="py-4 px-6 text-sm text-slate-200 font-medium">{item.issue}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{item.time}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
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
                    <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
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