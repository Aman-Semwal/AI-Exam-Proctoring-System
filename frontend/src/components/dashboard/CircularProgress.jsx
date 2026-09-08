const CircularProgress = ({ percentage = 91 }) => {
  const radius = 60;
  const stroke = 7;
  const norm = radius - stroke / 2;
  const circ = norm * 2 * Math.PI;
  const offset = circ - (percentage / 100) * circ;

  return (
    <div className="card p-6 flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Overall Score</h2>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Weighted Avg</span>
      </div>

      <div className="relative flex items-center justify-center my-3">
        <svg height={148} width={148} className="transform -rotate-90">
          <circle stroke="var(--border)" fill="transparent" strokeWidth={stroke}
            r={norm} cx="74" cy="74" />
          <circle stroke="#3b82f6" fill="transparent" strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            r={norm} cx="74" cy="74" className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>
            {percentage}%
          </span>
          <span className="text-[10px] text-emerald-500 font-semibold tracking-wide uppercase mt-0.5">
            Grade A+
          </span>
        </div>
      </div>

      <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>
        Top 5% among candidate cohort
      </p>
    </div>
  );
};

export default CircularProgress;