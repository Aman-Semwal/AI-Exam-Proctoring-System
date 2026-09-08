const ResultCard = ({ subject, marks, grade, status }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm">
      <div className="flex justify-between items-start gap-3">
        <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
          {subject}
        </h3>

        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0">
          {status}
        </span>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Score</span>
          <span className="text-white font-semibold text-sm mt-0.5 block">{marks}</span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Grade</span>
          <span className="text-blue-400 font-semibold text-sm mt-0.5 block">{grade}</span>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;