import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch } from "react-icons/fa";
import api from "../../services/api";

export default function ActiveExams() {
  const [exams, setExams] = useState([]);
  const [liveSessions, setLiveSessions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadActiveExams = async () => {
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

      // Load sessions for every active exam.
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

              return ["ACTIVE", "ONGOING", "IN_PROGRESS"].includes(status);
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
  };

  useEffect(() => {
    loadActiveExams();

    // Refresh live information periodically.
    const interval = setInterval(loadActiveExams, 30000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      <OrganizationSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Active Exams Monitoring
            </h1>

            <p className="text-[11px] text-slate-400">
              Track and supervise currently running examinations across
              departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                Organization Admin
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Live Streams
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Currently Running Exams
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Real-time candidate monitoring and active assessment
                telemetry.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sessions Active
            </div>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search active exams by title, course, or proctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
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
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Exam Details</th>
                      <th className="pb-3 px-3">Live Candidates</th>
                      <th className="pb-3 px-3">Assigned Proctor</th>
                      <th className="pb-3 px-3">
                        Start Time / Duration
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <ActiveExamRow key={exam.id} exam={exam} />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
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
    </div>
  );
}

const ActiveExamRow = ({ exam }) => {
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

  return (
    <tr className="hover:bg-white/[0.02] transition">
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
    </tr>
  );
};

