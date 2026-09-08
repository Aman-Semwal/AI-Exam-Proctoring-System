import { FaShieldAlt, FaCheckCircle } from "react-icons/fa";

const AIStatus = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/[0.06]">
        <h2 className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
          <FaShieldAlt className="text-blue-400" size={12} />
          Surveillance Diagnostics
        </h2>
        <span className="text-[10px] font-mono text-emerald-400">NORMAL</span>
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
          <span className="text-slate-400">Microphone</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <FaCheckCircle size={10} /> Active
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Tab Switches</span>
          <span className="font-mono text-slate-300 font-semibold bg-white/[0.04] px-1.5 py-0.5 rounded text-[11px]">0</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400">Flagged Warnings</span>
          <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px]">0 / 3</span>
        </div>
      </div>
    </div>
  );
};

export default AIStatus;