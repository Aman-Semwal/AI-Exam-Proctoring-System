const ExamTimer = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-xl font-bold text-white mb-5">
        ⏱ Exam Timer
      </h2>

      <div className="text-center">

        <h1 className="text-5xl font-bold text-cyan-400">
          01:29:59
        </h1>

        <p className="text-gray-400 mt-3">
          Remaining Time
        </p>

      </div>

    </div>
  );
};

export default ExamTimer;