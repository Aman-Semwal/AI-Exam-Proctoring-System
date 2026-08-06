const ExamCard = ({ subject, date, time, status }) => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-cyan-400 transition-all duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">{subject}</h3>

        <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-sm">
          {status}
        </span>
      </div>

      <div className="mt-5 space-y-2 text-gray-400">
        <p>📅 {date}</p>
        <p>🕒 {time}</p>
      </div>

      <button className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-semibold transition">
        Start Exam
      </button>
    </div>
  );
};

export default ExamCard;