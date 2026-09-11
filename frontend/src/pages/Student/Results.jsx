import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import ResultCard from "../../components/common/ResultCard";

import api from "../../services/api";

const Results = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sessions/my");

        const sessions = response.data?.data || [];

        const completedSessions = sessions.filter(
          (session) =>
            session.status === "COMPLETED" ||
            session.status === "SUBMITTED"
        );

        // If a particular session was requested, keep it highlighted/available
        let finalResults = completedSessions;

        if (sessionId) {
          const selectedSession = completedSessions.find(
            (session) => String(session.id) === String(sessionId)
          );

          if (selectedSession) {
            finalResults = [
              selectedSession,
              ...completedSessions.filter(
                (session) => String(session.id) !== String(sessionId)
              ),
            ];
          }
        }

        setResults(finalResults);
      } catch (err) {
        console.error("Failed to fetch results:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your exam results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  const calculatePercentage = (score) => {
    if (score === null || score === undefined) return "N/A";

    return `${score}%`;
  };

  const calculateGrade = (score) => {
    if (score === null || score === undefined) return "N/A";

    if (score >= 90) return "A+";
    if (score >= 80) return "A";
    if (score >= 70) return "B+";
    if (score >= 60) return "B";
    if (score >= 50) return "C";
    if (score >= 40) return "D";

    return "F";
  };

  const calculateStatus = (score) => {
    if (score === null || score === undefined) return "Completed";

    return score >= 40 ? "Passed" : "Failed";
  };

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Exam Results
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              View all your completed examination results and scores.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

                <p className="text-sm text-slate-400">
                  Loading your results...
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-red-300 text-sm">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && results.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
              <div className="text-4xl mb-4">📊</div>

              <h3 className="text-lg font-semibold text-white">
                No Results Yet
              </h3>

              <p className="text-sm text-slate-400 mt-2">
                Your completed exam results will appear here.
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && !error && results.length > 0 && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((session) => {
                const score = session.score;

                return (
                  <ResultCard
                    key={session.id}
                    subject={
                      session.examTitle ||
                      `Exam #${session.examId || session.id}`
                    }
                    marks={calculatePercentage(score)}
                    grade={calculateGrade(score)}
                    status={calculateStatus(score)}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Results;