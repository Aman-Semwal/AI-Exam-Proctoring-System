import { FaShieldAlt, FaCheckCircle } from "react-icons/fa";

const items = [
  "Face Detection",
  "Eye Tracking",
  "Voice Monitoring",
  "Tab Switch Guard",
];

const AIStatusCard = () => (
  <div className="card p-5">
    <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-blue-500"
        style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <FaShieldAlt size={16} />
      </div>
      <div>
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>AI Monitoring</h2>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>System Telemetry & Health</p>
      </div>
    </div>
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex justify-between items-center text-xs">
          <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{item}</span>
          <span className="badge-active flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold">
            <FaCheckCircle size={9} /> Active
          </span>
        </div>
      ))}
    </div>
  </div>
);

export default AIStatusCard;