import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
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
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-xs shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-bold mt-0.5 text-blue-500">Score: {payload[0].value}%</p>
    </div>
  );
};

const PerformanceChart = () => (
  <div className="card p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Performance Overview</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Monthly academic scoring progression</p>
      </div>
      <span className="badge-active px-2.5 py-0.5 rounded-full text-[10px] font-semibold">+23% vs Jan</span>
    </div>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} domain={[50, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2.5}
            dot={{ fill: "#3b82f6", r: 4, strokeWidth: 2, stroke: "var(--bg-base)" }}
            activeDot={{ r: 6, fill: "#60a5fa" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default PerformanceChart;