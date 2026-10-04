import { useEffect, useState } from "react";
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import api from "../../services/api";

/** `tabSwitches` comes from LiveExam, which gets the server-side count. */
const AIStatus = ({ sessionId, tabSwitches = 0 }) => {
  const [warningCount, setWarningCount] = useState(0);

  // Poll violation count for this session
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const fetchViolations = async () => {
      try {
        const res = await api.get(`/proctor/session/${sessionId}/my-violation-count`);
        if (isMounted) setWarningCount(Number(res.data?.data) || 0);
      } catch {
        // transient — the next poll retries
      }
    };

    fetchViolations();
    const interval = setInterval(fetchViolations, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  const isCritical = warningCount >= 3 || tabSwitches >= 3;
  const isElevated = warningCount > 0 || tabSwitches > 0;

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/6">
        <h2 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
          <FaShieldAlt
            className={
              isCritical
                ? "text-rose-400"
                : isElevated
                ? "text-amber-400"
                : "text-blue-400"
            }
            size={12}
          />
          Surveillance Diagnostics
        </h2>
        <span
          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
            isCritical
              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse"
              : isElevated
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}
        >
          {isCritical ? "HIGH RISK" : isElevated ? "MONITORED" : "NORMAL"}
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Face Detection</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <FaCheckCircle size={10} /> Active
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Eye Tracking</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <FaCheckCircle size={10} /> Calibrated
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Audio Stream</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <FaCheckCircle size={10} /> Monitored
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Tab Switches</span>
          <span
            className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[11px] ${
              tabSwitches > 0
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-white/4 text-slate-300"
            }`}
          >
            {tabSwitches}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Flagged Warnings</span>
          <span
            className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-1 ${
              isCritical
                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                : isElevated
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                : "bg-emerald-500/10 text-emerald-400"
            }`}
          >
            {isCritical && <FaExclamationTriangle size={9} />}
            {warningCount} / 3
          </span>
        </div>
      </div>
    </div>
  );
};

export default AIStatus;
