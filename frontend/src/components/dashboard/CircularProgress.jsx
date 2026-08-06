const CircularProgress = ({ percentage }) => {

  const radius = 70;
  const stroke = 10;

  const normalizedRadius = radius - stroke / 2;

  const circumference = normalizedRadius * 2 * Math.PI;

  const strokeDashoffset =
    circumference -
    (percentage / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 flex flex-col items-center">

      <h2 className="text-white text-2xl font-bold mb-8">
        Overall Score
      </h2>

      <svg
        height={160}
        width={160}
      >

        <circle
          stroke="#1e293b"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx="80"
          cy="80"
        />

        <circle
          stroke="#06b6d4"
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={normalizedRadius}
          cx="80"
          cy="80"
          transform="rotate(-90 80 80)"
        />

        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fill="white"
          fontSize="28"
          fontWeight="bold"
        >
          {percentage}%
        </text>

      </svg>

    </div>
  );
};

export default CircularProgress;