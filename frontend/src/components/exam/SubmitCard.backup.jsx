const SubmitCard = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-white tracking-tight mb-2">
        Finish Assessment
      </h2>

      <p className="text-slate-400 text-xs mb-4 leading-relaxed">
        Ensure all questions are reviewed before final submission. This action is irreversible.
      </p>

      <button className="w-full bg-rose-600 hover:bg-rose-500 py-2.5 rounded-lg text-white font-semibold text-xs transition active:scale-[0.98] shadow-sm">
        Submit Final Exam
      </button>
    </div>
  );
};

export default SubmitCard;