const ResultCard = ({
  subject,
  marks,
  grade,
  status,
}) => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-cyan-400 transition-all duration-300">

      <div className="flex justify-between items-center">

        <h3 className="text-xl font-semibold text-white">
          {subject}
        </h3>

        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm">
          {status}
        </span>

      </div>

      <div className="mt-6 space-y-3">

        <div className="flex justify-between">

          <span className="text-gray-400">
            Score
          </span>

          <span className="text-cyan-400 font-semibold">
            {marks}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Grade
          </span>

          <span className="text-yellow-400 font-semibold">
            {grade}
          </span>

        </div>

      </div>

    </div>
  );
};

export default ResultCard;