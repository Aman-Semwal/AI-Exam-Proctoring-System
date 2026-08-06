const SubmitCard = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-xl font-bold text-white mb-4">
        Submit Exam
      </h2>

      <p className="text-gray-400 mb-6">
        Make sure all questions are answered before submitting your exam.
      </p>

      <button className="w-full bg-red-500 hover:bg-red-600 py-4 rounded-xl text-white font-bold transition">
        Submit Exam
      </button>

    </div>
  );
};

export default SubmitCard;