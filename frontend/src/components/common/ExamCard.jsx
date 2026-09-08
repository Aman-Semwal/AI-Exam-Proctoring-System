import { FaCalendarAlt, FaClock } from "react-icons/fa";

const ExamCard = ({ subject, date, time, status }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-blue-500/30 transition-all duration-200 shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
          {subject}
        </h3>

        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-medium shrink-0">
          {status}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <FaCalendarAlt size={11} className="text-slate-500" />
          {date}
        </span>
        <span className="flex items-center gap-1.5">
          <FaClock size={11} className="text-slate-500" />
          {time}
        </span>
      </div>

      <button className="mt-5 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-semibold transition active:scale-[0.98]">
        Start Exam
      </button>
    </div>
  );
};

export default ExamCard;