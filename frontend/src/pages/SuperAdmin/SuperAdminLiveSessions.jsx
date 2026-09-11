import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaVideo,
  FaExclamationTriangle,
  FaUserShield,
  FaDesktop,
} from "react-icons/fa";
import api from "../../services/api";

const SuperAdminLiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLiveSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const examResponse = await api.get("/exams");

      const examData = examResponse.data?.data ?? examResponse.data;

      const exams = Array.isArray(examData)
        ? examData
        : Array.isArray(examData?.content)
        ? examData.content
        : Array.isArray(examData?.exams)
        ? examData.exams
        : [];

      const sessionResults = await Promise.all(
        exams.map(async (exam) => {
          try {
            const response = await api.get(`/sessions/exam/${exam.id}`);

            const data = response.data?.data ?? response.data;

            const examSessions = Array.isArray(data)
              ? data
              : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(data?.sessions)
              ? data.sessions
              : [];

            return examSessions
              .filter((session) => {
                const status = String(session.status || "").toUpperCase();

                return [
                  "ACTIVE",
                  "ONGOING",
                  "IN_PROGRESS",
                  "LIVE",
                ].includes(status);
              })
              .map((session) => ({
                ...session,
                examTitle:
                  session.examTitle ||
                  exam.title ||
                  exam.name ||
                  "Untitled Exam",
                organizationName:
                  session.orgName ||
                  session.organizationName ||
                  exam.orgName ||
                  exam.organizationName ||
                  "Organization",
              }));
          } catch (sessionError) {
            console.warn(
              `Could not load sessions for exam ${exam.id}`,
              sessionError
            );
            return [];
          }
        })
      );

      const liveSessions = sessionResults.flat();

      const sessionsWithRisk = await Promise.all(
        liveSessions.map(async (session) => {
          let violations = [];

          try {
            const violationResponse = await api.get(
              `/violations/session/${session.id}`
            );

            const violationData =
              violationResponse.data?.data ?? violationResponse.data;

            violations = Array.isArray(violationData)
              ? violationData
              : Array.isArray(violationData?.content)
              ? violationData.content
              : Array.isArray(violationData?.violations)
              ? violationData.violations
              : [];
          } catch (violationError) {
            console.warn(
              `Could not load violations for session ${session.id}`,
              violationError
            );
          }

          const highRiskCount = violations.filter((violation) => {
            const severity = String(
              violation.severity || violation.risk || ""
            ).toUpperCase();

            return severity === "HIGH" || severity === "CRITICAL";
          }).length;

          const mediumRiskCount = violations.filter((violation) => {
            const severity = String(
              violation.severity || violation.risk || ""
            ).toUpperCase();

            return severity === "MEDIUM";
          }).length;

          let risk = "Low";

          if (highRiskCount > 0) {
            risk = "High";
          } else if (mediumRiskCount > 0 || violations.length >= 2) {
            risk = "Medium";
          }

          return {
            id: session.id,
            student:
              session.studentName ||
              session.student?.name ||
              session.name ||
              "Unknown Student",
            exam: session.examTitle,
            org:
              session.organizationName ||
              session.orgSlug ||
              "Organization",
            proctor:
              session.proctorName ||
              session.proctor?.name ||
              session.proctor ||
              "AI Proctor",
            status: session.status || "ACTIVE",
            risk,
            violationCount: violations.length,
          };
        })
      );

      setSessions(sessionsWithRisk);
    } catch (err) {
      console.error("Failed to load live sessions:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load live sessions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveSessions();

    const interval = setInterval(fetchLiveSessions, 30000);

    return () => clearInterval(interval);
  }, []);

  const liveCount = useMemo(() => sessions.length, [sessions]);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                Surveillance Grid
              </span>

              <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Live AI Monitoring & Sessions
              </h1>

              <p className="text-slate-400 mt-1 text-xs sm:text-sm">
                Real-time surveillance feeds and proctored examination
                streams.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-3.5 py-1.5 rounded-lg w-fit">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />

              <span className="text-xs font-semibold text-rose-400 font-mono">
                {liveCount} Live Streams
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-red-300">{error}</p>

              <button
                onClick={fetchLiveSessions}
                className="text-xs font-semibold text-red-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-12 text-center">
              <div className="w-8 h-8 mx-auto mb-3 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin" />

              <p className="text-sm text-slate-400">
                Loading live examination sessions...
              </p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-12 text-center">
              <FaVideo className="mx-auto text-slate-700 text-3xl mb-3" />

              <h3 className="text-sm font-semibold text-white">
                No Live Sessions
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                There are currently no active examination sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm"
                >
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <FaDesktop size={12} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-white text-xs">
                          {s.student}
                        </h3>

                        <p className="text-[10px] text-slate-400">
                          {s.org}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        s.risk === "High"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : s.risk === "Medium"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}
                    >
                      Risk: {s.risk}
                    </span>
                  </div>

                  {/* Video / Feed */}
                  <div className="relative w-full h-36 bg-[#090a0f] rounded-lg overflow-hidden border border-white/[0.06] flex items-center justify-center mb-3">
                    <FaVideo className="text-slate-800 text-2xl animate-pulse" />

                    <div className="absolute bottom-2.5 left-2.5 text-[10px] text-slate-300 font-mono bg-black/60 px-1.5 py-0.5 rounded max-w-[85%] truncate">
                      Exam: {s.exam}
                    </div>

                    {s.risk === "High" && (
                      <div className="absolute top-2.5 right-2.5 bg-rose-600/90 text-white px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-semibold">
                        <FaExclamationTriangle size={10} />
                        Suspicious
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.05]">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <FaUserShield
                        className="text-blue-400"
                        size={11}
                      />

                      {s.proctor}
                    </span>

                    <button className="px-2.5 py-1 rounded bg-[#090a0f] hover:bg-white/[0.05] border border-white/[0.08] text-blue-400 text-[11px] font-medium transition">
                      Inspect Feed
                    </button>
                  </div>

                  {/* Violation count */}
                  {s.violationCount > 0 && (
                    <div className="mt-3 text-[10px] text-amber-400">
                      {s.violationCount} proctoring violation
                      {s.violationCount !== 1 ? "s" : ""} detected
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLiveSessions;

