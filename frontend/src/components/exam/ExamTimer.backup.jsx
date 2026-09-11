import { FaClock } from "react-icons/fa";

const ExamTimer = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <FaClock size={11} className="text-blue-400" />
          Time Remaining
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">Auto-Submit Active</span>
      </div>

      <div className="text-center py-2 bg-[#090a0f] border border-white/[0.06] rounded-lg">
        <h1 className="text-3xl font-bold font-mono text-blue-400 tracking-wider">
          01:29:59
        </h1>
        <p className="text-[11px] text-slate-500 mt-1">
          Total Duration: 02:00:00
        </p>
      </div>
    </div>
  );
};

export default ExamTimer;