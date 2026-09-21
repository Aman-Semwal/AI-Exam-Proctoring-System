import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import api from "../../services/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const percentage = (score, total) => {
  if (score == null || !total) return null;
  return Math.round((score / total) * 100);
};

const grade = (pct) => {
  if (pct == null) return "N/A";
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
};

const passed = (pct) => (pct == null ? null : pct >= 40);

const duration = (start, end) => {
  if (!start || !end) return null;
  const ms = new Date(end) - new Date(start);
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
};

const fmt = (dt) => {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/**
 * Badge shown in the breakdown table for each question's correctness status.
 * isCorrect: true → green tick, false → red cross, null → amber pending.
 */
const CorrectnessBadge = ({ isCorrect }) => {
  if (isCorrect === true)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        ✓ Correct
      </span>
    );
  if (isCorrect === false)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
        ✗ Incorrect
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
      ⏳ Pending
    </span>
  );
};

/**
 * Spinner shown while per-session result is loading.
 */
const DetailSpinner = () => (
  <div className="rounded-xl border border-white/[0.07] bg-[#121520] p-10 flex flex-col items-center justify-center gap-4 min-h-[320px]">
    <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-sm text-slate-400">Loading result details…</p>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionIdParam = searchParams.get("sessionId");

  // Session list state
  const [sessions, setSessions] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  // Currently selected session ID (just the ID, not the full object)
  const [selectedId, setSelectedId] = useState(null);

  // Per-session result state
  const [result, setResult] = useState(null);       // ExamResultResponse
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState("");

  // ── Fetch session list ──────────────────────────────────────────────────

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setListLoading(true);
        setListError("");

        const response = await api.get("/sessions/my");
        const all = response.data?.data || [];

        const completed = all.filter(
          (s) => s.status === "COMPLETED" || s.status === "SUBMITTED"
        );

        setSessions(completed);

        // Auto-select session from URL param if present
        if (sessionIdParam) {
          const target = completed.find(
            (s) => String(s.id) === String(sessionIdParam)
          );
          if (target) setSelectedId(target.id);
        }
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setListError(
          err.response?.data?.message || "Unable to load your exam results."
        );
      } finally {
        setListLoading(false);
      }
    };

    fetchSessions();
  }, [sessionIdParam]);

  // ── Fetch result + answers when a session is selected ──────────────────

  const fetchResult = useCallback(async (id) => {
    if (!id) return;

    setResultLoading(true);
    setResultError("");
    setResult(null);

    try {
      // Fire both requests in parallel — result has the breakdown so answers
      // is secondary; we store it on the result object for potential future use.
      const [resultRes, answersRes] = await Promise.all([
        api.get(`/sessions/${id}/result`),
        api.get(`/answers/session/${id}`),
      ]);

      const resultData = resultRes.data?.data ?? resultRes.data;
      const answersData = answersRes.data?.data ?? answersRes.data ?? [];

      // Attach the raw answers array alongside the result for completeness
      setResult({ ...resultData, _rawAnswers: answersData });
    } catch (err) {
      console.error("Failed to fetch result for session", id, err);
      setResultError(
        err.response?.data?.message ||
          "Unable to load the result for this session."
      );
    } finally {
      setResultLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId != null) {
      fetchResult(selectedId);
    } else {
      setResult(null);
      setResultError("");
    }
  }, [selectedId, fetchResult]);

  // ── Derived values for the selected result ──────────────────────────────

  const resultPct = result?.percentage ?? percentage(result?.score, result?.totalMarks);
  const resultGrade = result?.grade ?? grade(resultPct);
  const resultPassed = passed(resultPct);
  const isProvisional = resultPct == null && (result?.pendingReview ?? 0) > 0;
  const resultDur = result?.timeTakenMinutes != null
    ? `${result.timeTakenMinutes}m`
    : duration(result?.startTime, result?.endTime);

  // ── UI ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Page header */}
          <div className="pb-4 mb-6 border-b border-white/6">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Exam Results
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              View all your completed examination results and score breakdowns.
            </p>
          </div>

          {/* List loading */}
          {listLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-400">Loading your results…</p>
              </div>
            </div>
          )}

          {/* List error */}
          {!listLoading && listError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
              <p className="text-red-300 text-sm">{listError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty state */}
          {!listLoading && !listError && sessions.length === 0 && (
            <div className="rounded-xl border border-white/6 bg-white/2 p-10 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-white">No Results Yet</h3>
              <p className="text-sm text-slate-400 mt-2">
                Your completed exam results will appear here.
              </p>
            </div>
          )}

          {/* Two-panel layout */}
          {!listLoading && !listError && sessions.length > 0 && (
            <div className="grid lg:grid-cols-12 gap-6">

              {/* ── Session list ── */}
              <div className="lg:col-span-4 space-y-3">
                {sessions.map((s) => {
                  const pct = percentage(s.score, s.totalMarks);
                  const ok = passed(pct);
                  const isActive = selectedId === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedId(s.id)}
                      className={`w-full text-left rounded-xl border p-4 transition ${
                        isActive
                          ? "border-blue-500/40 bg-blue-500/10"
                          : "border-white/[0.07] bg-[#121520] hover:bg-white/3"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">
                            {s.examTitle || `Exam #${s.examId}`}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {fmt(s.startTime)} · Session #{s.id}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg font-bold text-white">
                            {pct != null ? `${pct}%` : "—"}
                          </span>
                          <p
                            className={`text-[11px] font-semibold ${
                              ok === true
                                ? "text-emerald-400"
                                : ok === false
                                ? "text-red-400"
                                : "text-slate-400"
                            }`}
                          >
                            {ok === true
                              ? "Passed"
                              : ok === false
                              ? "Failed"
                              : "Pending"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ok === true
                                ? "bg-emerald-500"
                                : ok === false
                                ? "bg-red-500"
                                : "bg-slate-500"
                            }`}
                            style={{ width: pct != null ? `${pct}%` : "0%" }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">
                          {s.score ?? "—"}/{s.totalMarks ?? "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Detail panel ── */}
              <div className="lg:col-span-8">
                {/* Nothing selected yet */}
                {selectedId == null && (
                  <div className="rounded-xl border border-white/6 bg-[#121520] p-10 text-center h-full flex flex-col items-center justify-center">
                    <div className="text-4xl mb-3">👈</div>
                    <p className="text-sm text-slate-400">
                      Select a result to see the breakdown
                    </p>
                  </div>
                )}

                {/* Loading result */}
                {selectedId != null && resultLoading && <DetailSpinner />}

                {/* Result error */}
                {selectedId != null && !resultLoading && resultError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                    <p className="text-red-300 text-sm">{resultError}</p>
                    <button
                      onClick={() => fetchResult(selectedId)}
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Result loaded */}
                {selectedId != null && !resultLoading && !resultError && result && (
                  <div className="rounded-xl border border-white/[0.07] bg-[#121520] p-6 space-y-6">

                    {/* ── Title row ── */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">
                          {result.examTitle || `Exam #${result.examId}`}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Session #{result.sessionId} · {fmt(result.startTime)}
                        </p>
                        {result.studentName && (
                          <p className="text-xs text-slate-500">
                            {result.studentName}
                            {result.studentEmail ? ` · ${result.studentEmail}` : ""}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        {/* Pass/Fail / Provisional badge */}
                        {isProvisional ? (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border text-amber-400 bg-amber-500/10 border-amber-500/20">
                            ⏳ Provisional
                          </span>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${
                              resultPassed === true
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                : resultPassed === false
                                ? "text-red-400 bg-red-500/10 border-red-500/20"
                                : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                            }`}
                          >
                            {resultPassed === true
                              ? "✓ Passed"
                              : resultPassed === false
                              ? "✗ Failed"
                              : "Completed"}
                          </span>
                        )}
                        {result.sessionStatus && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border text-slate-400 bg-slate-500/10 border-slate-500/20">
                            {result.sessionStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Score summary cards ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          label: "Score",
                          value:
                            result.score != null
                              ? `${result.score}/${result.totalMarks ?? "?"}`
                              : "—",
                          accent: "text-blue-400",
                        },
                        {
                          label: "Percentage",
                          value: isProvisional
                            ? "Provisional"
                            : resultPct != null
                            ? `${resultPct}%`
                            : "—",
                          accent: isProvisional
                            ? "text-amber-400"
                            : resultPassed === true
                            ? "text-emerald-400"
                            : resultPassed === false
                            ? "text-red-400"
                            : "text-slate-300",
                        },
                        {
                          label: "Grade",
                          value: isProvisional ? "—" : resultGrade,
                          accent: "text-purple-400",
                        },
                        {
                          label: "Duration",
                          value: resultDur ?? "—",
                          accent: "text-amber-400",
                        },
                      ].map(({ label, value, accent }) => (
                        <div
                          key={label}
                          className="bg-[#090a0f] border border-white/6 rounded-lg p-3 text-center"
                        >
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            {label}
                          </p>
                          <p className={`text-xl font-bold mt-1 ${accent}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* ── Question stats row ── */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        {
                          label: "Total Qs",
                          value: result.totalQuestions ?? "—",
                          accent: "text-slate-300",
                        },
                        {
                          label: "Attempted",
                          value: result.attempted ?? "—",
                          accent: "text-blue-400",
                        },
                        {
                          label: "Correct",
                          value: result.correct ?? "—",
                          accent: "text-emerald-400",
                        },
                        {
                          label: "Incorrect",
                          value: result.incorrect ?? "—",
                          accent: "text-red-400",
                        },
                        {
                          label: "Pending Review",
                          value: result.pendingReview ?? "—",
                          accent: "text-amber-400",
                        },
                      ].map(({ label, value, accent }) => (
                        <div
                          key={label}
                          className="bg-[#090a0f] border border-white/6 rounded-lg p-3 text-center"
                        >
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                            {label}
                          </p>
                          <p className={`text-lg font-bold mt-1 ${accent}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* ── Violations & proctoring ── */}
                    {(result.totalViolations != null ||
                      result.criticalViolations != null) && (
                      <div className="bg-[#090a0f] border border-white/6 rounded-lg p-4">
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">
                          Proctoring Summary
                        </p>
                        <div className="flex flex-wrap gap-4">
                          {result.totalViolations != null && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">
                                Total Violations:
                              </span>
                              <span
                                className={`font-bold text-sm ${
                                  result.totalViolations > 0
                                    ? "text-orange-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {result.totalViolations}
                              </span>
                            </div>
                          )}
                          {result.criticalViolations != null && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-xs">
                                Critical Violations:
                              </span>
                              <span
                                className={`font-bold text-sm ${
                                  result.criticalViolations > 0
                                    ? "text-red-400"
                                    : "text-emerald-400"
                                }`}
                              >
                                {result.criticalViolations}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── Session metadata ── */}
                    <div className="bg-[#090a0f] border border-white/6 rounded-lg p-4 grid sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                      {[
                        {
                          label: "Applied Role",
                          value: result.appliedRole || "—",
                        },
                        {
                          label: "Unattempted",
                          value: result.unattempted ?? "—",
                        },
                        {
                          label: "Started",
                          value: result.startTime
                            ? new Date(result.startTime).toLocaleString()
                            : "—",
                        },
                        {
                          label: "Ended",
                          value: result.endTime
                            ? new Date(result.endTime).toLocaleString()
                            : "—",
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between gap-2">
                          <span className="text-slate-500">{label}</span>
                          <span className="text-slate-200 font-medium text-right">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* ── Question-by-question breakdown ── */}
                    {result.breakdown && result.breakdown.length > 0 && (
                      <div>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium mb-3">
                          Question Breakdown
                        </p>
                        <div className="rounded-lg border border-white/6 overflow-hidden">
                          {/* Table header */}
                          <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-2 bg-white/[0.03] border-b border-white/6 text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                            <div className="col-span-1">#</div>
                            <div className="col-span-4">Question</div>
                            <div className="col-span-2">Type</div>
                            <div className="col-span-1 text-center">Marks</div>
                            <div className="col-span-2">Your Answer</div>
                            <div className="col-span-2 text-center">Result</div>
                          </div>

                          {/* Table rows */}
                          {result.breakdown.map((item, idx) => {
                            const studentAnswer =
                              item.selectedOption || item.textAnswer || "—";

                            return (
                              <div
                                key={item.questionId ?? idx}
                                className={`grid sm:grid-cols-12 grid-cols-1 gap-3 px-4 py-3 text-xs border-b border-white/[0.04] last:border-0 ${
                                  idx % 2 === 0
                                    ? "bg-transparent"
                                    : "bg-white/[0.015]"
                                }`}
                              >
                                {/* # */}
                                <div className="sm:col-span-1 text-slate-500 font-mono">
                                  <span className="sm:hidden text-[10px] text-slate-600 mr-1">
                                    #
                                  </span>
                                  {idx + 1}
                                </div>

                                {/* Question text */}
                                <div className="sm:col-span-4 text-slate-200 leading-relaxed">
                                  <span className="sm:hidden text-[10px] text-slate-500 block mb-0.5">
                                    Question
                                  </span>
                                  {item.questionText || `Question ${idx + 1}`}
                                </div>

                                {/* Type */}
                                <div className="sm:col-span-2 text-slate-400">
                                  <span className="sm:hidden text-[10px] text-slate-500 mr-1">
                                    Type:
                                  </span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-white/[0.05] border border-white/[0.06] font-medium">
                                    {item.questionType || "—"}
                                  </span>
                                </div>

                                {/* Marks */}
                                <div className="sm:col-span-1 sm:text-center text-blue-400 font-semibold">
                                  <span className="sm:hidden text-[10px] text-slate-500 mr-1">
                                    Marks:
                                  </span>
                                  {item.marks ?? "—"}
                                </div>

                                {/* Student answer */}
                                <div className="sm:col-span-2 text-slate-300 break-words">
                                  <span className="sm:hidden text-[10px] text-slate-500 block mb-0.5">
                                    Your Answer
                                  </span>
                                  <span className="italic">
                                    {studentAnswer}
                                  </span>
                                </div>

                                {/* Correctness */}
                                <div className="sm:col-span-2 sm:text-center">
                                  <span className="sm:hidden text-[10px] text-slate-500 block mb-0.5">
                                    Result
                                  </span>
                                  <CorrectnessBadge isCorrect={item.isCorrect} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Actions ── */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => navigate("/student/dashboard")}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Results;
