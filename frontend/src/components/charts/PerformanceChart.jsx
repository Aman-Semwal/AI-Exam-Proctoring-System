import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const data = [
  { subject: "OS", score: 85 },
  { subject: "CN", score: 90 },
  { subject: "DBMS", score: 88 },
  { subject: "AI", score: 95 },
  { subject: "ML", score: 92 },
];

const PerformanceChart = () => {
  return (
    <div className="bg-slate-900 rounded-2xl border border-white/10 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        Performance Overview
      </h2>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />

            <XAxis dataKey="subject" stroke="#94A3B8" />

            <YAxis stroke="#94A3B8" />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="score"
              stroke="#06B6D4"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PerformanceChart;