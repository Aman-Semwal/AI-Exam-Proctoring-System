import { useEffect, useMemo, useState } from "react";
import {
  FaShieldAlt,
  FaSearch,
  FaSignOutAlt,
  FaRedo,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ProctorDashboard() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [liveExams, setLiveExams] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getList = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.sessions)) return data.sessions;
    if (Array.isArray(data?.violations)) return data.violations;

    return [];
  };

  const formatTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const normalizeSeverity = (severity) => {
    const value = String(severity || "LOW").toUpperCase();

    if (value === "CRITICAL") return "Critical";
    if (value === "HIGH") return "High";
    if (value === "MEDIUM") return "Medium";

    return "Low";
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const examsResponse = await api.get("/exams");
      const exams = getList(examsResponse);

      const activeExamList = exams.filter((exam) =>
        ["ACTIVE", "ONGOING", "LIVE", "PUBLISHED"].includes(
          String(exam.status || "").toUpperCase()
        )
      );

      setLiveExams(activeExamList.length);

      const sessionResponses = await Promise.all(
        activeExamList.map((exam) =>
          api
            .get(`/sessions/exam/${exam.id}`)
            .catch(() => ({ data: { data: [] } }))
        )
      );

      const sessions = sessionResponses.flatMap(getList);

      const activeSessionStatuses = [
        "ACTIVE",
        "ONGOING",
        "IN_PROGRESS",
        "LIVE",
      ];

      const liveSessions = sessions.filter((session) =>
        activeSessionStatuses.includes(
          String(session.status || "").toUpperCase()
        )
      );

      setActiveStudents(liveSessions.length);

      const violationResponses = await Promise.all(
        liveSessions.map((session) =>
          api
            .get(`/violations/session/${session.id}`)
            .catch(() => ({ data: { data: [] } }))
        )
      );

      const violationData = violationResponses.flatMap(getList);

      const formattedIncidents = violationData.map((violation, index) => {
        const session = liveSessions.find(
          (item) => item.id === violation.sessionId
        );

        const exam = exams.find(
          (item) =>
            item.id ===
            (violation.examId ?? session?.examId)
        );

        return {
          id: violation.id ?? `${violation.sessionId}-${index}`,
          student:
            violation.studentName ||
            session?.studentName ||
            violation.student?.name ||
            "Unknown Student",

          exam:
            violation.examTitle ||
            session?.examTitle ||
            exam?.title ||
            exam?.name ||
            "Unknown Exam",

          issue:
            violation.description ||
            violation.message ||
            violation.violationType ||
            violation.type ||
            "Proctoring violation",

          time: formatTime(
            violation.createdAt ||
              violation.timestamp ||
              violation.detectedAt
          ),

          severity: normalizeSeverity(
            violation.severity ||
              violation.riskLevel
          ),
        };
      });

      setIncidents(formattedIncidents);
    } catch (err) {
      console.error("Failed to load proctor dashboard:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load proctor dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return incidents.filter(
      (item) =>
        item.student.toLowerCase().includes(query) ||
        item.exam.toLowerCase().includes(query) ||
        item.issue.toLowerCase().includes(query)
    );
  }, [incidents, searchQuery]);

  const pendingAlerts = incidents.filter((item) =>
    ["High", "Critical"].includes(item.severity)
  ).length;

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-[#0d0f17] border-r border-white/[0.07] flex flex-col justify-between p-4 shrink-0 sticky top-0 h-screen">
        <div>
          <div
            className="p-3 mb-4 cursor-pointer flex items-center gap-3 group"
            onClick={() => navigate("/proctor/dashboard")}
          >
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaShieldAlt size={16} />
            </div>

            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Proctor<span className="text-blue-400">Portal</span>
              </h1>

              <p className="text-[11px] text-slate-400 font-medium">
                Invigilator Command
              </p>
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

      {/* Main */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Surveillance Room
            </span>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Proctor Control Center
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Live monitoring, anomaly alerts, and student behavior tracking.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Shift Monitoring
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>

            <button
              onClick={fetchDashboardData}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
            >
              <FaRedo size={11} />
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Live Exams
            </p>

            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
              {loading ? "—" : String(liveExams).padStart(2, "0")}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Students
            </p>

            <p className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2 font-mono">
              {loading ? "—" : activeStudents}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Pending Alerts
            </p>

            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono">
              {loading ? "—" : pendingAlerts}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Violations Flagged
            </p>

            <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono">
              {loading ? "—" : incidents.length}
            </p>
          </div>
        </div>

        {/* Incidents */}
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
              Recorded Alerts:{" "}
              <span className="font-semibold text-white">
                {filteredIncidents.length}
              </span>
            </div>
          </div>

          {/* Table */}
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
                {loading ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-slate-500"
                    >
                      Loading live monitoring data...
                    </td>
                  </tr>
                ) : filteredIncidents.length > 0 ? (
                  filteredIncidents.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.02] transition"
                    >
                      <td className="py-3.5 px-3 font-semibold text-white">
                        {item.student}
                      </td>

                      <td className="py-3.5 px-3 text-slate-300">
                        {item.exam}
                      </td>

                      <td className="py-3.5 px-3 text-slate-200 font-medium">
                        {item.issue}
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 font-mono">
                        {item.time}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            item.severity === "Critical" ||
                            item.severity === "High"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : item.severity === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-10 text-center text-slate-500 text-xs"
                    >
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