const data = [
  { label: "OS", height: "h-36", value: "85%" },
  { label: "CN", height: "h-44", value: "90%" },
  { label: "DBMS", height: "h-40", value: "88%" },
  { label: "AI", height: "h-48", value: "95%" },
  { label: "ML", height: "h-42", value: "92%" },
];

const PerformanceChart = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-white tracking-tight">
          Performance
        </h2>
        <span className="text-xs text-slate-400 font-medium">Subject-wise</span>
      </div>

      <div className="flex items-end justify-between gap-3 h-52 pt-4">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
            <span className="text-[11px] font-mono text-slate-400 group-hover:text-blue-400 transition-colors">
              {item.value}
            </span>
            <div className={`w-full max-w-[40px] bg-blue-600/30 border border-blue-500/40 rounded-t-lg ${item.height} group-hover:bg-blue-600/50 transition-all`} />
            <span className="text-xs font-medium text-slate-400 mt-1">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceChart;