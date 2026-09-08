import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 80 },
  { month: "Mar", score: 76 },
  { month: "Apr", score: 88 },
  { month: "May", score: 91 },
  { month: "Jun", score: 95 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#121520] border border-white/[0.1] rounded-lg p-2.5 shadow-xl text-xs">
        <p className="text-slate-400 font-medium">{label}</p>
        <p className="text-blue-400 font-bold mt-0.5">
          Score: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const PerformanceChart = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Performance Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Monthly academic scoring progression</p>
        </div>
        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          +23% vs Jan
        </span>
      </div>

      <div className="h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[50, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "#090a0f" }}
              activeDot={{ r: 6, fill: "#60a5fa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;