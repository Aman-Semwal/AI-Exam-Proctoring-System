import { FaBell, FaCheckCircle, FaFileAlt } from "react-icons/fa";

const NotificationCard = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Notifications & Updates
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
      </div>

      <div className="space-y-3 text-xs">
        <div className="bg-[#090a0f] border border-white/[0.06] rounded-lg p-3.5 flex items-start gap-3">
          <FaBell className="text-amber-400 mt-0.5 shrink-0" size={13} />
          <div>
            <p className="text-slate-200 font-medium leading-snug">AI Exam starts tomorrow.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Please test your webcam 15 mins prior.</p>
          </div>
        </div>

        <div className="bg-[#090a0f] border border-white/[0.06] rounded-lg p-3.5 flex items-start gap-3">
          <FaFileAlt className="text-blue-400 mt-0.5 shrink-0" size={13} />
          <div>
            <p className="text-slate-200 font-medium leading-snug">New Result Published.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Operating Systems score available in archive.</p>
          </div>
        </div>

        <div className="bg-[#090a0f] border border-white/[0.06] rounded-lg p-3.5 flex items-start gap-3">
          <FaCheckCircle className="text-emerald-400 mt-0.5 shrink-0" size={13} />
          <div>
            <p className="text-slate-200 font-medium leading-snug">Profile Verified Successfully.</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Identity credentials confirmed by admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;