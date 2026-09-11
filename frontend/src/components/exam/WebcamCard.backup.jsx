import { FaCamera, FaCheckCircle } from "react-icons/fa";

const WebcamCard = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Live Proctored Feed
        </h2>
        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          REC 1080p
        </span>
      </div>

      {/* Camera Preview HUD */}
      <div className="relative h-48 rounded-lg bg-[#090a0f] border border-white/[0.08] flex flex-col items-center justify-center overflow-hidden">
        {/* Subtle Face Detection HUD rectangle */}
        <div className="absolute inset-x-8 inset-y-6 border border-blue-500/30 rounded-lg pointer-events-none flex items-start justify-between p-2">
          <span className="text-[9px] font-mono text-blue-400/80 bg-blue-500/10 px-1 rounded">FACE_CONF: 99.4%</span>
          <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1 rounded">EYE_GAZE: CENTER</span>
        </div>

        <div className="text-center z-10">
          <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto mb-2">
            <FaCamera size={20} />
          </div>
          <p className="text-xs text-slate-400 font-medium">Candidate Feed Stream</p>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs">
        <span className="text-emerald-400 flex items-center gap-1.5 text-[11px] font-medium">
          <FaCheckCircle size={11} /> Camera Connected
        </span>

        <button className="bg-[#090a0f] hover:bg-white/[0.04] border border-white/[0.08] text-slate-200 px-3 py-1.5 rounded-md text-[11px] font-medium transition">
          Test Camera
        </button>
      </div>
    </div>
  );
};

export default WebcamCard;