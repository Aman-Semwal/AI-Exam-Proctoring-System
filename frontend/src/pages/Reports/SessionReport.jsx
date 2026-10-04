import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaFileCsv, FaPrint } from "react-icons/fa";
import api from "../../services/api";
import TrustBadge from "../../components/common/TrustBadge";
import EvidenceImage from "../../components/common/EvidenceImage";

const fmt = (value) => (value ? new Date(value).toLocaleString() : "—");
const label = (type) => String(type || "").replace(/_/g, " ").toLowerCase();

const SEVERITY_COLORS = {
  CRITICAL: "text-rose-300",
  HIGH: "text-orange-300",
  MEDIUM: "text-amber-300",
  LOW: "text-slate-300",
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (report) => {
  const header = ["Time", "Type", "Severity", "Details", "Review outcome", "Evidence"];
  const rows = report.timeline.map((e) => [
    fmt(e.time),
    e.type,
    e.severity,
    e.details,
    e.reviewOutcome || "Not reviewed",
    e.hasEvidence ? "Yes" : "No",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-${report.sessionId}-violations.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Integrity report for one exam session — printable (Save as PDF) and exportable as CSV. */
const SessionReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/sessions/${id}/report`)
      .then((res) => setReport(res.data?.data))
      .catch((err) => setError(err.response?.data?.message || "Could not load the report."));
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-6">
        <p className="text-rose-400 text-sm">{error}</p>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-slate-400 flex items-center justify-center p-6 text-sm">
        Loading report…
      </div>
    );
  }

  const summary = [
    ["Student", `${report.studentName} (${report.studentEmail})`],
    ["Exam", report.examTitle],
    ["Status", report.status],
    ["Attempt", report.attemptNumber],
    ["Started", fmt(report.startTime)],
    ["Ended", fmt(report.endTime)],
    ["Duration", report.durationMinutes != null ? `${report.durationMinutes} min` : "—"],
    ["Score", report.score ?? "—"],
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 print:bg-white print:text-black">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        {/* Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between print:hidden">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white"
          >
            <FaArrowLeft size={11} /> Back
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(report)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-xs text-slate-200 hover:bg-white/5"
            >
              <FaFileCsv size={12} /> Export CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold"
            >
              <FaPrint size={11} /> Print / Save as PDF
            </button>
          </div>
        </div>

        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/8 print:border-black/20 pb-4">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-blue-400 print:text-black">
              Exam integrity report · Session #{report.sessionId}
            </p>
            <h1 className="text-2xl font-bold mt-1">{report.examTitle}</h1>
          </div>
          <TrustBadge score={report.trustScore} level={report.trustLevel} className="text-sm" />
        </header>

        <section className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {summary.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-white/4 print:border-black/10 py-1">
              <span className="text-slate-500 print:text-black/60">{k}</span>
              <span className="font-medium text-right">{v}</span>
            </div>
          ))}
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          {[
            ["Violations by type", report.countsByType],
            ["Violations by severity", report.countsBySeverity],
          ].map(([title, counts]) => (
            <div key={title} className="rounded-xl border border-white/7 print:border-black/20 p-4">
              <h2 className="text-xs font-semibold text-slate-400 print:text-black uppercase tracking-wider mb-2">{title}</h2>
              {Object.keys(counts || {}).length === 0 ? (
                <p className="text-sm text-emerald-400 print:text-black">None recorded</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {Object.entries(counts).map(([key, n]) => (
                    <li key={key} className="flex justify-between capitalize">
                      <span>{label(key)}</span>
                      <span className="font-mono">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-400 print:text-black uppercase tracking-wider mb-3">
            Timeline ({report.timeline.length})
          </h2>
          {report.timeline.length === 0 ? (
            <p className="text-sm text-slate-500">No violations were recorded in this session.</p>
          ) : (
            <ol className="space-y-3">
              {report.timeline.map((e) => (
                <li
                  key={e.violationId}
                  className="rounded-xl border border-white/7 print:border-black/20 p-4 flex flex-col sm:flex-row gap-4 break-inside-avoid"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span className="font-mono text-slate-500 print:text-black/60">{fmt(e.time)}</span>
                      <span className="font-semibold capitalize">{label(e.type)}</span>
                      <span className={`font-semibold ${SEVERITY_COLORS[e.severity] || ""} print:text-black`}>
                        {e.severity}
                      </span>
                      <span className="text-slate-500 print:text-black/60">
                        {e.reviewOutcome === "DISMISSED"
                          ? "Dismissed (false positive)"
                          : e.reviewOutcome === "CONFIRMED"
                          ? "Confirmed"
                          : "Not reviewed"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 print:text-black mt-1.5">{e.details}</p>
                  </div>
                  <div className="sm:w-48 shrink-0">
                    {e.hasEvidence ? (
                      <EvidenceImage violationId={e.violationId} className="w-full h-28 object-cover" />
                    ) : (
                      <p className="text-[11px] text-slate-600 print:text-black/50">No image (browser event)</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="text-[11px] text-slate-600 print:text-black/50">
          Trust score = 100 minus a penalty per violation not dismissed by a reviewer (Low 2, Medium 5, High 10,
          Critical 20). It is recomputed whenever a violation is reviewed. Flags are evidence for a human
          decision, not an automatic verdict.
        </p>
      </div>
    </div>
  );
};

export default SessionReport;
