import { useState } from "react";

const QuestionPanel = () => {
  const [selectedOption, setSelectedOption] = useState("A");

  const options = [
    { key: "A", text: "function Component()" },
    { key: "B", text: "createComponent()" },
    { key: "C", text: "React.new()" },
    { key: "D", text: "Component.create()" },
  ];

  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/[0.06]">
        <div>
          <span className="text-[11px] font-mono font-medium text-blue-400 uppercase tracking-wider">
            Assessment Section 1
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Question 1 of 20
          </h2>
        </div>
        <span className="text-xs text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-md font-mono">
          Single Choice (+4 / -1)
        </span>
      </div>

      <p className="text-slate-200 text-sm sm:text-base mb-6 leading-relaxed">
        Which of the following is used to create a React component?
      </p>

      {/* Options List */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSelectedOption(opt.key)}
              className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center gap-3.5 ${
                isSelected
                  ? "bg-blue-600/15 border-blue-500/50 text-white shadow-sm"
                  : "bg-[#090a0f] border-white/[0.07] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.02]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-semibold shrink-0 transition-colors ${
                  isSelected
                    ? "border-blue-400 bg-blue-500 text-white"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                {opt.key}
              </div>
              <span>{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/[0.06]">
        <button className="bg-[#090a0f] hover:bg-white/[0.04] border border-white/[0.08] px-5 py-2.5 rounded-lg text-xs font-medium text-slate-300 transition">
          Previous
        </button>

        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition active:scale-[0.98]">
          Save & Next
        </button>
      </div>
    </div>
  );
};

export default QuestionPanel;