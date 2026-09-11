import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaCamera,
  FaVolumeUp,
  FaDesktop,
  FaFileAlt,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
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
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <section
      id="features"
      className={`py-28 relative overflow-hidden transition-colors duration-300 ${
        isDark ? "bg-[#050508] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Background ambient lighting */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full blur-[160px] pointer-events-none ${
          isDark ? "bg-blue-600/5" : "bg-blue-400/10"
        }`}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span
            className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          >
            Capabilities
          </span>
          <h2
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            The magic of AI Proctoring
          </h2>

          {/* Action Buttons (System Docs & Live Engine) */}
          <div
            className={`inline-flex items-center gap-2 p-1 rounded-full border mt-6 ${
              isDark
                ? "bg-[#0d0f17] border-white/[0.08]"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <button
              onClick={() => navigate("/docs")}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                isDark
                  ? "text-slate-300 hover:text-white hover:bg-white/[0.08]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              System Docs
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 cursor-pointer"
            >
              Live Engine
            </button>
          </div>
        </div>

        {/* 4-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Immerse into vision */}
          <div
            className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden group transition-all duration-300 ${
              isDark
                ? "bg-[#090b12] border-white/[0.08] hover:border-blue-500/30"
                : "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:border-blue-300"
            }`}
          >
            <h3
              className={`text-lg font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Immerse into vision
            </h3>
            <p
              className={`text-xs mt-1 max-w-sm leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Detect micro-expressions, gaze angles, and multiple faces with
              high-frequency spatial computer vision.
            </p>

            {/* Futuristic Telemetry HUD Display Mock */}
            <div
              className={`mt-6 rounded-2xl border p-4 relative overflow-hidden h-52 flex flex-col justify-between ${
                isDark
                  ? "bg-[#05060a] border-white/[0.06]"
                  : "bg-slate-900 border-slate-800 text-white"
              }`}
            >
              {/* Radar Grid Graphic */}
              <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

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
          <div
            className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden group transition-all duration-300 ${
              isDark
                ? "bg-[#090b12] border-white/[0.08] hover:border-blue-500/30"
                : "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:border-blue-300"
            }`}
          >
            <h3
              className={`text-lg font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Integrated safeguards
            </h3>
            <p
              className={`text-xs mt-1 max-w-sm leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Connect and synchronize across a rich suite of cheating
              countermeasures simultaneously.
            </p>

            {/* Badges Matrix */}
            <div className="mt-6 grid grid-cols-3 gap-3 h-52 items-center">
              {ecosystemBadges.map((badge, idx) => (
                <div
                  key={idx}
                  className={`border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all ${
                    isDark
                      ? "bg-[#0e111a] border-white/[0.06] group-hover:border-blue-500/25"
                      : "bg-slate-50 border-slate-200 hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mb-2">
                    {badge.icon}
                  </div>
                  <span
                    className={`text-[11px] font-semibold ${
                      isDark ? "text-slate-200" : "text-slate-700"
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Best Neural Performance */}
          <div
            className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden group transition-all duration-300 ${
              isDark
                ? "bg-[#090b12] border-white/[0.08] hover:border-blue-500/30"
                : "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:border-blue-300"
            }`}
          >
            <h3
              className={`text-lg font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Best neural performance
            </h3>
            <p
              className={`text-xs mt-1 max-w-sm leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Powerful on-device neural acceleration delivers sub-millisecond
              anomaly classification without server bottlenecks.
            </p>

            {/* Chip Image Container */}
            <div
              className={`mt-6 rounded-2xl overflow-hidden border flex items-center justify-center h-52 ${
                isDark
                  ? "bg-[#05060a] border-white/[0.06]"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <img
                src={neuralChipImg}
                alt="AI Neural Chip"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* Card 4: Surveillance intelligence */}
          <div
            className={`border rounded-3xl p-6 sm:p-8 relative overflow-hidden group transition-all duration-300 ${
              isDark
                ? "bg-[#090b12] border-white/[0.08] hover:border-blue-500/30"
                : "bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:border-blue-300"
            }`}
          >
            <h3
              className={`text-lg font-bold tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Surveillance intelligence
            </h3>
            <p
              className={`text-xs mt-1 max-w-sm leading-relaxed ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Unlock actionable testing insights with automated evidentiary PDF
              reports and chronological audit logs.
            </p>

            {/* Wireframe Diagram Graphic */}
            <div
              className={`mt-6 rounded-2xl border p-5 h-52 flex flex-col justify-between ${
                isDark
                  ? "bg-[#05060a] border-white/[0.06]"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div
                className={`flex items-center justify-between border-b pb-2 ${
                  isDark ? "border-white/[0.06]" : "border-slate-200"
                }`}
              >
                <span
                  className={`text-[10px] font-mono ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  INTEGRITY_INDEX
                </span>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                  SCORE: 98.4%
                </span>
              </div>

              {/* Progress Bars Matrix */}
              <div className="space-y-2.5 my-auto">
                <div>
                  <div
                    className={`flex justify-between text-[10px] font-mono mb-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <span>Identity Authenticity</span>
                    <span className={isDark ? "text-white" : "text-slate-900"}>
                      100%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isDark ? "bg-[#0e111a]" : "bg-slate-200"
                    }`}
                  >
                    <div className="h-full bg-blue-500 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div
                    className={`flex justify-between text-[10px] font-mono mb-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <span>Gaze Genuineness</span>
                    <span className={isDark ? "text-white" : "text-slate-900"}>
                      96.8%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isDark ? "bg-[#0e111a]" : "bg-slate-200"
                    }`}
                  >
                    <div className="h-full bg-indigo-500 rounded-full w-[96.8%]" />
                  </div>
                </div>

                <div>
                  <div
                    className={`flex justify-between text-[10px] font-mono mb-1 ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    <span>Acoustic Background</span>
                    <span className={isDark ? "text-white" : "text-slate-900"}>
                      99.2%
                    </span>
                  </div>
                  <div
                    className={`h-1.5 rounded-full overflow-hidden ${
                      isDark ? "bg-[#0e111a]" : "bg-slate-200"
                    }`}
                  >
                    <div className="h-full bg-emerald-500 rounded-full w-[99.2%]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[9px] font-mono text-emerald-500">
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