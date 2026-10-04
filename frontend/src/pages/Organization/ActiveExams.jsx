import { useCallback, useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaEye, FaVideo, FaTimes, FaCalendarAlt, FaClock, FaUserGraduate, FaArrowLeft } from "react-icons/fa";
import ActionDropdown from "../../components/common/ActionDropdown";
import Toast from "../../components/common/Toast";
import api from "../../services/api";

export default function ActiveExams() {
  const [exams, setExams] = useState([]);
  const [liveSessions, setLiveSessions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [detailExam, setDetailExam] = useState(null);
  const [telemetryExam, setTelemetryExam] = useState(null);
  const [telemetrySessions, setTelemetrySessions] = useState([]);
  const [loadingTelemetry, setLoadingTelemetry] = useState(false);
  const [selectedCandidateSession, setSelectedCandidateSession] = useState(null);
  const [candidateViolations, setCandidateViolations] = useState([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [toast, setToast] = useState(null);

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const loadActiveExams = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/exams");

      const data = response.data?.data;

      const examList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(response.data)
        ? response.data
        : [];

      const activeList = examList.filter((exam) => {
        const status = String(exam.status || "").toUpperCase();

        return ["ACTIVE", "ONGOING", "LIVE", "PUBLISHED"].includes(status);
      });

      setExams(activeList);

      const sessionResults = await Promise.all(
        activeList.map(async (exam) => {
          try {
            const sessionResponse = await api.get(
              `/sessions/exam/${exam.id}`
            );

            const sessionData = sessionResponse.data?.data;

            const sessions = Array.isArray(sessionData)
              ? sessionData
              : Array.isArray(sessionData?.content)
              ? sessionData.content
              : Array.isArray(sessionResponse.data)
              ? sessionResponse.data
              : [];

            const activeSessions = sessions.filter((session) => {
              const status = String(session.status || "").toUpperCase();

              return ["ACTIVE", "ONGOING", "IN_PROGRESS", "LIVE"].includes(status);
            });

            return {
              examId: exam.id,
              sessions: activeSessions,
            };
          } catch (sessionError) {
            console.warn(
              `Could not load sessions for exam ${exam.id}:`,
              sessionError
            );

            return {
              examId: exam.id,
              sessions: [],
            };
          }
        })
      );

      const sessionMap = {};

      sessionResults.forEach(({ examId, sessions }) => {
        sessionMap[examId] = sessions;
      });

      setLiveSessions(sessionMap);
    } catch (err) {
      console.error("Failed to load active exams:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load active exams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveExams();

    const interval = setInterval(() => {
      loadActiveExams();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadActiveExams]);

  const examRows = useMemo(() => {
    return exams.map((exam) => {
      const sessions = liveSessions[exam.id] || [];

      const studentsLive =
        sessions.length ||
        exam.studentsLive ||
        exam.liveStudents ||
        exam.activeStudents ||
        0;

      const proctor =
        exam.proctor ||
        exam.proctorName ||
        exam.assignedProctor ||
        exam.assignedProctorName ||
        sessions[0]?.proctorName ||
        "Not Assigned";

      return {
        ...exam,
        studentsLive,
        proctor,
      };
    });
  }, [exams, liveSessions]);

  const filteredExams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return examRows;

    return examRows.filter((exam) => {
      const title = String(
        exam.title || exam.name || exam.examTitle || ""
      ).toLowerCase();

      const course = String(
        exam.course || exam.courseCode || exam.subject || ""
      ).toLowerCase();

      const proctor = String(exam.proctor || "").toLowerCase();

      return (
        title.includes(query) ||
        course.includes(query) ||
        proctor.includes(query)
      );
    });
  }, [examRows, searchQuery]);

  // Open Telemetry Modal
  const handleOpenTelemetry = async (exam) => {
    setTelemetryExam(exam);
    setSelectedCandidateSession(null);
    setCandidateViolations([]);
    setLoadingTelemetry(true);
    try {
      const res = await api.get(`/sessions/exam/${exam.id}`);
      const data = res.data?.data ?? res.data ?? [];
      setTelemetrySessions(Array.isArray(data) ? data : data?.content || []);
    } catch (err) {
      console.error("Telemetry fetch error:", err);
      setToast({ type: "error", message: "Failed to load live sessions." });
      setTelemetrySessions([]);
    } finally {
      setLoadingTelemetry(false);
    }
  };

  // Inspect Candidate Violations
  const handleInspectCandidateViolations = async (session) => {
    setSelectedCandidateSession(session);
    setLoadingViolations(true);
    try {
      const res = await api.get(`/violations/session/${session.id}`);
      const data = res.data?.data ?? res.data ?? [];
      setCandidateViolations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not load candidate violations:", err);
      setCandidateViolations([]);
    } finally {
      setLoadingViolations(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      <OrganizationSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/7 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Active Exams Monitoring
            </h1>

            <p className="text-[11px] text-slate-400">
              Track and supervise currently running examinations across departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              {(currentUser?.name || "OA").slice(0, 2).toUpperCase()}
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {currentUser?.name || "Organization Admin"}
              </p>

              <p className="text-[10px] text-slate-400 leading-tight">
                Organization Admin
              </p>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/6">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Live Streams
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Currently Running Exams
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Real-time candidate monitoring and active assessment telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sessions Active
            </div>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search active exams by title, course, or proctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/8 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total Live Exams:{" "}
                <span className="font-semibold text-white">
                  {filteredExams.length}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={loadActiveExams}
                  className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading active exams...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-187.5">
                  <thead>
                    <tr className="border-b border-white/6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Exam Details</th>
                      <th className="pb-3 px-3">Live Candidates</th>
                      <th className="pb-3 px-3">Assigned Proctor</th>
                      <th className="pb-3 px-3">Start Time / Duration</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/4 text-xs">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <ActiveExamRow
                          key={exam.id}
                          exam={exam}
                          onViewDetails={() => setDetailExam(exam)}
                          onViewTelemetry={() => handleOpenTelemetry(exam)}
                        />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="5"
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          No active exams found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Exam Details Modal */}
      {detailExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/7">
              <h3 className="text-base font-bold text-white">Active Exam Details</h3>
              <button
                type="button"
                onClick={() => setDetailExam(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 block">Title</span>
                <p className="font-semibold text-white text-sm mt-0.5">{detailExam.title || "Untitled"}</p>
              </div>

              {detailExam.description && (
                <div>
                  <span className="text-slate-500 block">Description</span>
                  <p className="text-slate-300 mt-0.5">{detailExam.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5">
                  <span className="text-slate-500 block">Duration</span>
                  <p className="font-mono font-semibold text-blue-400 mt-1">
                    {detailExam.durationMinutes || detailExam.duration || 60} mins
                  </p>
                </div>

                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5">
                  <span className="text-slate-500 block">Status</span>
                  <p className="font-mono font-semibold text-emerald-400 mt-1">
                    {detailExam.status || "ACTIVE"}
                  </p>
                </div>
              </div>

              <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-300">
                  <FaCalendarAlt className="text-blue-400" size={11} />
                  <span>Start: {detailExam.startTime ? new Date(detailExam.startTime).toLocaleString() : "Live Now"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <FaClock className="text-amber-400" size={11} />
                  <span>Invigilator: {detailExam.proctor || "Not Assigned"}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailExam(null)}
                className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-xs text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Sessions Telemetry Modal */}
      {telemetryExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#121520] border border-white/10 rounded-xl shadow-2xl p-6 my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/7">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <FaVideo className="text-emerald-400 text-sm" />
                  Live Candidate Telemetry
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {telemetryExam.title || "Exam"} &bull; Real-time sessions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTelemetryExam(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {selectedCandidateSession ? (
              /* Candidate Violation Inspection Drilldown */
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-[#090a0f] p-3 rounded-lg border border-white/6">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateSession(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                      title="Back to Candidate List"
                    >
                      <FaArrowLeft size={11} />
                    </button>
                    <div>
                      <p className="font-bold text-white text-sm">
                        {selectedCandidateSession.studentName || `Student #${selectedCandidateSession.studentId || selectedCandidateSession.id}`}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Session #{selectedCandidateSession.id} &bull; Started: {selectedCandidateSession.startTime ? new Date(selectedCandidateSession.startTime).toLocaleTimeString() : "—"}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold font-mono text-[11px]">
                    {candidateViolations.length} total flags
                  </span>
                </div>

                {loadingViolations ? (
                  <div className="py-10 text-center text-slate-400">
                    Loading candidate violation stream...
                  </div>
                ) : candidateViolations.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 border border-white/5 rounded-lg">
                    No proctoring violation incidents recorded for this candidate.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {candidateViolations.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 rounded-lg border border-white/6 bg-[#090a0f] flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                v.severity === "CRITICAL" || v.severity === "HIGH"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : v.severity === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                              }`}
                            >
                              {v.type || "VIOLATION"} ({v.severity || "LOW"})
                            </span>
                            {v.reviewed && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Reviewed
                              </span>
                            )}
                          </div>
                          <p className="text-slate-300 font-medium">{v.details || "AI Flagged suspicious candidate activity"}</p>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            {v.createdAt ? new Date(v.createdAt).toLocaleTimeString() : "—"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : loadingTelemetry ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading candidate sessions...
              </div>
            ) : telemetrySessions.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 border border-white/5 rounded-lg">
                No active student sessions currently running for this exam.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/6 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Student</th>
                      <th className="pb-2">Started At</th>
                      <th className="pb-2">Violations</th>
                      <th className="pb-2">Session Status</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/4">
                    {telemetrySessions.map((session, idx) => (
                      <tr key={session.id || idx} className="hover:bg-white/2">
                        <td className="py-2.5 font-medium text-white flex items-center gap-2">
                          <FaUserGraduate className="text-blue-400" size={11} />
                          {session.studentName || session.studentEmail || `Student #${session.studentId || idx + 1}`}
                        </td>
                        <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                          {session.startTime ? new Date(session.startTime).toLocaleTimeString() : "—"}
                        </td>
                        <td className="py-2.5 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            (session.violationCount ?? session.violations ?? 0) > 0
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}>
                            {session.violationCount ?? session.violations ?? 0} flags
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {session.status || "LIVE"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleInspectCandidateViolations(session)}
                            className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-[11px] font-semibold border border-blue-500/30 transition"
                          >
                            Inspect Flags
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 pt-3 border-t border-white/7 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTelemetryExam(null);
                  setSelectedCandidateSession(null);
                }}
                className="px-4 py-2 rounded-lg bg-white/6 hover:bg-white/10 text-xs text-white"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

const ActiveExamRow = ({ exam, onViewDetails, onViewTelemetry }) => {
  const title =
    exam.title || exam.name || exam.examTitle || "Untitled Exam";

  const course =
    exam.course || exam.courseCode || exam.subject || "N/A";

  const studentsLive = exam.studentsLive || 0;

  const proctor = exam.proctor || "Not Assigned";

  const rawStartTime =
    exam.startTime ||
    exam.startDateTime ||
    exam.startDate ||
    exam.scheduledAt;

  const parsedDate = rawStartTime
    ? new Date(rawStartTime)
    : null;

  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime());

  const formattedStartTime = validDate
    ? parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : exam.startTime || "Not set";

  const duration =
    exam.duration ||
    (exam.durationMinutes
      ? `${exam.durationMinutes} Minutes`
      : "Not set");

  const menuItems = [
    {
      label: "Live Telemetry",
      icon: FaVideo,
      onClick: onViewTelemetry,
    },
    {
      label: "Exam Details",
      icon: FaEye,
      onClick: onViewDetails,
    },
  ];

  return (
    <tr className="hover:bg-white/2 transition">
      <td className="py-3 px-3">
        <div>
          <p className="font-semibold text-white">
            {title}
          </p>

          <span className="inline-block font-mono text-[11px] text-blue-400 mt-0.5">
            {course}
          </span>
        </div>
      </td>

      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5 font-mono text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

          <span>{studentsLive} students</span>
        </div>
      </td>

      <td className="py-3 px-3 text-slate-300">
        {proctor}
      </td>

      <td className="py-3 px-3">
        <p className="font-medium text-white">
          {formattedStartTime}
        </p>

        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          {duration}
        </p>
      </td>

      <td className="py-3 px-3 text-right">
        <ActionDropdown items={menuItems} />
      </td>
    </tr>
  );
};
