const QuestionPanel = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">

      <h2 className="text-2xl font-bold text-white mb-6">
        Question 1 of 20
      </h2>

      <p className="text-gray-300 text-lg mb-8">
        Which of the following is used to create a React component?
      </p>

      <div className="space-y-4">

        <button className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black transition">
          A. function Component()
        </button>

        <button className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black transition">
          B. createComponent()
        </button>

        <button className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black transition">
          C. React.new()
        </button>

        <button className="w-full text-left p-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-black transition">
          D. Component.create()
        </button>

      </div>

      <div className="flex justify-between mt-10">

        <button className="bg-slate-700 hover:bg-slate-600 px-6 py-3 rounded-xl text-white">
          Previous
        </button>

        <button className="bg-cyan-500 hover:bg-cyan-400 px-6 py-3 rounded-xl text-black font-semibold">
          Next
        </button>

      </div>

    </div>
  );
};

export default QuestionPanel;