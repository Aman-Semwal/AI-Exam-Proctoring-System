import { useEffect, useState } from "react";
import { FaShieldAlt, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import api from "../../services/api";

const AIStatus = ({ sessionId }) => {
  const [warningCount, setWarningCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);

  // Poll violation count for this session
  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;

    const fetchViolations = async () => {
      try {
        const res = await api.get(`/violations/session/${sessionId}`);
        const data = res.data?.data ?? res.data ?? [];
        if (isMounted) {
          setWarningCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        // quiet warning
      }
    };

    fetchViolations();
    const interval = setInterval(fetchViolations, 6000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionId]);

  // Track browser window blur / tab switches
  useEffect(() => {
    const handleBlur = () => {
      setTabSwitches((prev) => prev + 1);
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const isCritical = warningCount >= 3 || tabSwitches >= 3;
  const isElevated = warningCount > 0 || tabSwitches > 0;

  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
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
                : "bg-white/[0.04] text-slate-300"
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
