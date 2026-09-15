import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import api from "../../services/api";

const Results = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");

  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/sessions/my");
        const all = response.data?.data || [];

        const completed = all.filter(
          (s) => s.status === "COMPLETED" || s.status === "SUBMITTED"
        );

        setSessions(completed);

        // Auto-select the session from the URL param if present
        if (sessionId) {
          const target = completed.find(
            (s) => String(s.id) === String(sessionId)
          );
          if (target) setSelected(target);
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(err.response?.data?.message || "Unable to load your exam results.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [sessionId]);

  // ─── Derived helpers ───────────────────────────────────────────────────────

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
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Page header */}
          <div className="pb-4 mb-6 border-b border-white/6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Exam Results</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              View all your completed examination results and score breakdowns.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-400">Loading your results...</p>
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

          {/* Empty */}
          {!loading && !error && sessions.length === 0 && (
            <div className="rounded-xl border border-white/6 bg-white/2 p-10 text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-white">No Results Yet</h3>
              <p className="text-sm text-slate-400 mt-2">
                Your completed exam results will appear here.
              </p>
            </div>
          )}

          {/* Two-panel layout — list + detail */}
          {!loading && !error && sessions.length > 0 && (
            <div className="grid lg:grid-cols-12 gap-6">

              {/* ── Session list ── */}
              <div className="lg:col-span-4 space-y-3">
                {sessions.map((s) => {
                  const pct = percentage(s.score, s.totalMarks);
                  const ok  = passed(pct);
                  const isActive = selected?.id === s.id;

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelected(s)}
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
                          <p className={`text-[11px] font-semibold ${
                            ok === true
                              ? "text-emerald-400"
                              : ok === false
                              ? "text-red-400"
                              : "text-slate-400"
                          }`}>
                            {ok === true ? "Passed" : ok === false ? "Failed" : "Pending"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {/* Score bar */}
                        <div className="flex-1 h-1.5 bg-white/6 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ok === true ? "bg-emerald-500" : ok === false ? "bg-red-500" : "bg-slate-500"
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
                {!selected ? (
                  <div className="rounded-xl border border-white/6 bg-[#121520] p-10 text-center h-full flex flex-col items-center justify-center">
                    <div className="text-4xl mb-3">👈</div>
                    <p className="text-sm text-slate-400">Select a result to see the breakdown</p>
                  </div>
                ) : (() => {
                  const pct = percentage(selected.score, selected.totalMarks);
                  const g   = grade(pct);
                  const ok  = passed(pct);
                  const dur = duration(selected.startTime, selected.endTime);

                  return (
                    <div className="rounded-xl border border-white/[0.07] bg-[#121520] p-6 space-y-6">
                      {/* Title row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {selected.examTitle || `Exam #${selected.examId}`}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            Session ID: {selected.id} · {fmt(selected.startTime)}
                          </p>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${
                          ok === true
                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                            : ok === false
                            ? "text-red-400 bg-red-500/10 border-red-500/20"
                            : "text-slate-400 bg-slate-500/10 border-slate-500/20"
                        }`}>
                          {ok === true ? "✓ Passed" : ok === false ? "✗ Failed" : "Completed"}
                        </span>
                      </div>

                      {/* Score summary cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          {
                            label: "Score",
                            value: selected.score != null ? `${selected.score}/${selected.totalMarks ?? "?"}` : "—",
                            accent: "text-blue-400",
                          },
                          {
                            label: "Percentage",
                            value: pct != null ? `${pct}%` : "—",
                            accent: ok === true ? "text-emerald-400" : ok === false ? "text-red-400" : "text-slate-300",
                          },
                          {
                            label: "Grade",
                            value: g,
                            accent: "text-purple-400",
                          },
                          {
                            label: "Duration",
                            value: dur ?? "—",
                            accent: "text-amber-400",
                          },
                        ].map(({ label, value, accent }) => (
                          <div key={label} className="bg-[#090a0f] border border-white/6 rounded-lg p-3 text-center">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">
                              {label}
                            </p>
                            <p className={`text-xl font-bold mt-1 ${accent}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Session metadata */}
                      <div className="bg-[#090a0f] border border-white/6 rounded-lg p-4 grid sm:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                        {[
                          { label: "Attempt",      value: `#${selected.attemptNumber ?? 1}` },
                          { label: "Status",        value: selected.status },
                          { label: "Started",       value: selected.startTime ? new Date(selected.startTime).toLocaleString() : "—" },
                          { label: "Ended",         value: selected.endTime   ? new Date(selected.endTime).toLocaleString()   : "—" },
                          { label: "Student",       value: selected.studentName  || "—" },
                          { label: "Organization",  value: selected.orgSlug      || "—" },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex justify-between gap-2">
                            <span className="text-slate-500">{label}</span>
                            <span className="text-slate-200 font-medium text-right">{value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => navigate("/student/dashboard")}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Results;
