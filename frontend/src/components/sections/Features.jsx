import { useState } from "react";
import {
  FaEye,
  FaCamera,
  FaShieldAlt,
  FaMicrochip,
  FaVolumeUp,
  FaDesktop,
  FaFileAlt,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";
import neuralChipImg from "../../assets/neural-chip.jpg";

const ecosystemBadges = [
  { icon: <FaCamera size={14} />, label: "Face ID" },
  { icon: <FaEye size={14} />, label: "Eye Gaze" },
  { icon: <FaVolumeUp size={14} />, label: "Audio Scan" },
  { icon: <FaDesktop size={14} />, label: "Tab Guard" },
  { icon: <FaLock size={14} />, label: "Lockdown" },
  { icon: <FaFileAlt size={14} />, label: "AI Report" },
];

const Features = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <section id="features" className="py-28 bg-[#050508] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-widest">
            Capabilities
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mt-2">
            The magic of AI Proctoring
          </h2>

          {/* Pill Toggle Buttons */}
          <div className="inline-flex items-center gap-2 p-1 rounded-full bg-[#0d0f17] border border-white/[0.08] mt-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === "overview"
                  ? "bg-white/[0.08] text-white border border-white/[0.15]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              System Docs
            </button>
            <button
              onClick={() => setActiveTab("demo")}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                activeTab === "demo"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Live Engine
            </button>
          </div>
        </div>

        {/* 4-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Immerse into vision */}
          <div className="bg-[#090b12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Immerse into vision
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Detect micro-expressions, gaze angles, and multiple faces with high-frequency spatial computer vision.
            </p>

            {/* Futuristic Telemetry HUD Display Mock */}
            <div className="mt-6 rounded-2xl bg-[#05060a] border border-white/[0.06] p-4 relative overflow-hidden h-52 flex flex-col justify-between">
              {/* Radar Grid Graphic */}
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

              {/* HUD Header */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 z-10">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  OPTICAL_TRACKER_01
                </span>
                <span className="text-emerald-400">GAZE_DEV: 0.02°</span>
              </div>

              {/* Center Wireframe Reticle */}
              <div className="flex items-center justify-center z-10">
                <div className="w-24 h-24 rounded-full border border-dashed border-blue-500/40 flex items-center justify-center relative">
                  <div className="w-12 h-12 rounded-full border border-blue-400/60 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                  </div>
                  {/* Crosshairs */}
                  <div className="absolute w-full h-px bg-blue-500/20" />
                  <div className="absolute h-full w-px bg-blue-500/20" />
                </div>
              </div>

              {/* HUD Footer */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 z-10">
                <span>FPS: 60.0</span>
                <span className="text-emerald-400">NOISE_FILTER: ACTIVE</span>
                <span>LATENCY: 12ms</span>
              </div>
            </div>
          </div>

          {/* Card 2: Connected Ecosystem */}
          <div className="bg-[#090b12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Integrated safeguards
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Connect and synchronize across a rich suite of cheating countermeasures simultaneously.
            </p>

            {/* Badges Matrix */}
            <div className="mt-6 grid grid-cols-3 gap-3 h-52 items-center">
              {ecosystemBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className="bg-[#0e111a] border border-white/[0.06] rounded-2xl p-4 flex flex-col items-center justify-center text-center group-hover:border-blue-500/25 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                    {badge.icon}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-200">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Best Neural Performance */}
          <div className="bg-[#090b12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Best neural performance
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Powerful on-device neural acceleration delivers sub-millisecond anomaly classification without server bottlenecks.
            </p>

            {/* Chip Image Container */}
            <div className="mt-6 rounded-2xl overflow-hidden bg-[#05060a] border border-white/[0.06] flex items-center justify-center h-52">
              <img
                src={neuralChipImg}
                alt="AI Neural Chip"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 4: Be Productive / Room Layout Analytics */}
          <div className="bg-[#090b12] border border-white/[0.08] rounded-3xl p-6 sm:p-8 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-300">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Surveillance intelligence
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
              Unlock actionable testing insights with automated evidentiary PDF reports and chronological audit logs.
            </p>

            {/* Wireframe Diagram Graphic */}
            <div className="mt-6 rounded-2xl bg-[#05060a] border border-white/[0.06] p-5 h-52 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                <span className="text-[10px] font-mono text-slate-400">INTEGRITY_INDEX</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">SCORE: 98.4%</span>
              </div>

              {/* Progress Bars Matrix */}
              <div className="space-y-2.5 my-auto">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Identity Authenticity</span>
                    <span className="text-white">100%</span>
                  </div>
                  <div className="h-1.5 bg-[#0e111a] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Gaze Genuineness</span>
                    <span className="text-white">96.8%</span>
                  </div>
                  <div className="h-1.5 bg-[#0e111a] rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full w-[96.8%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span>Acoustic Background</span>
                    <span className="text-white">99.2%</span>
                  </div>
                  <div className="h-1.5 bg-[#0e111a] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full w-[99.2%]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-400">
                <FaCheckCircle size={9} />
                <span>EXAM INTEGRITY CERTIFIED & VERIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;