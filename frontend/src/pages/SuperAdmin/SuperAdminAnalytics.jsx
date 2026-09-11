import { useEffect, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import api from "../../services/api";

const SuperAdminAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    organizations: 0,
    exams: 0,
    completedExams: 0,
    passRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getList = (response) => {
    const data = response.data?.data ?? response.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.organizations)) return data.organizations;
    if (Array.isArray(data?.exams)) return data.exams;
    if (Array.isArray(data?.sessions)) return data.sessions;

    return [];
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError("");

      const [organizationResponse, examResponse] = await Promise.all([
        api.get("/organizations"),
        api.get("/exams"),
      ]);

      const organizations = getList(organizationResponse);
      const exams = getList(examResponse);

      let allSessions = [];

      // Fetch sessions for every exam
      const sessionResults = await Promise.all(
        exams.map(async (exam) => {
          try {
            const response = await api.get(
              `/sessions/exam/${exam.id}`
            );

            return getList(response);
          } catch (sessionError) {
            console.warn(
              `Could not load sessions for exam ${exam.id}`,
              sessionError
            );

            return [];
          }
        })
      );

      allSessions = sessionResults.flat();

      const completedSessions = allSessions.filter((session) => {
        const status = String(session.status || "").toUpperCase();

        return ["COMPLETED", "SUBMITTED"].includes(status);
      });

      const sessionsWithScore = completedSessions.filter(
        (session) =>
          session.score !== null &&
          session.score !== undefined &&
          !Number.isNaN(Number(session.score))
      );

      let passRate = 0;

      if (sessionsWithScore.length > 0) {
        const passed = sessionsWithScore.filter((session) => {
          const score = Number(session.score);

          // Backend score is treated as percentage when <= 100.
          // If score is greater than 100, use the common 40% threshold
          // against the available numeric value.
          return score >= 40;
        }).length;

        passRate = Math.round(
          (passed / sessionsWithScore.length) * 1000
        ) / 10;
      }

      setAnalytics({
        organizations: organizations.length,
        exams: exams.length,
        completedExams: completedSessions.length,
        passRate,
      });
    } catch (err) {
      console.error("Failed to load platform analytics:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load platform analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Analytics & Telemetry
            </span>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Platform Analytics
            </h1>

            <p className="text-slate-400 mt-1 text-xs sm:text-sm">
              Deep insights, growth metrics, and comprehensive utilization
              reports.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-xs text-red-300">{error}</p>

              <button
                onClick={fetchAnalytics}
                className="text-xs font-semibold text-red-300 hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Organizations */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Total Institutions
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
                {loading ? "—" : analytics.organizations}
              </h2>

              <p className="text-xs text-purple-400 mt-1">
                Platform total
              </p>
            </div>

            {/* Exams */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Total Exams
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
                {loading ? "—" : analytics.exams}
              </h2>

              <p className="text-xs text-blue-400 mt-1">
                Global total
              </p>
            </div>

            {/* Completed */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Exams Completed
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
                {loading ? "—" : analytics.completedExams}
              </h2>

              <p className="text-xs text-emerald-400 mt-1">
                Completed submissions
              </p>
            </div>

            {/* Pass Rate */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Average Pass Rate
              </span>

              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 tracking-tight">
                {loading ? "—" : `${analytics.passRate}%`}
              </h2>

              <p className="text-xs text-emerald-400 mt-1">
                Based on completed sessions
              </p>
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Platform Utilization
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Current metrics collected from the platform APIs.
                </p>
              </div>

              <button
                onClick={fetchAnalytics}
                className="px-3 py-1.5 rounded-lg bg-[#090a0f] border border-white/[0.08] text-xs text-purple-400 hover:text-white hover:bg-white/[0.05] transition"
              >
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg border border-white/[0.06] bg-[#090a0f] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Institutions
                </p>

                <p className="text-xl font-bold text-white mt-1">
                  {loading ? "—" : analytics.organizations}
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#090a0f] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Exams
                </p>

                <p className="text-xl font-bold text-white mt-1">
                  {loading ? "—" : analytics.exams}
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#090a0f] p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Completed Sessions
                </p>

                <p className="text-xl font-bold text-white mt-1">
                  {loading ? "—" : analytics.completedExams}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminAnalytics;
