import {
  FaSlidersH,
  FaGlobe,
  FaVolumeUp,
  FaBolt,
  FaUsers,
  FaVideo,
  FaMobileAlt,
  FaFileContract,
  FaShieldAlt,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import sensorDeviceImg from "../../assets/sensor-device.jpg";

const HowItWorks = () => {
  const { isDark } = useTheme();

  return (
    <div
      className={`transition-colors duration-300 ${
        isDark ? "bg-[#050508] text-white" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ================= HIGHLIGHT SECTION 1: Captivating Security ================= */}
      <section
        className={`py-28 relative overflow-hidden border-t transition-colors duration-300 ${
          isDark ? "border-white/[0.05]" : "border-slate-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & 2x2 Feature points */}
          <div className="lg:col-span-7">
            <span
              className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              High Precision
            </span>
            <h2
              className={`text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Uncompromising vigilance
            </h2>
            <p
              className={`mt-4 text-xs sm:text-sm leading-relaxed max-w-xl ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              A new era of intelligent examination surveillance where
              institutions supervise online exams effortlessly, false flags are
              eradicated, and trust is restored.
            </p>

            {/* 2x2 Feature points grid */}
            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaSlidersH size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Adjustable thresholds
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Customizable tolerance for face deviations, eye gaze
                    angles, and noise levels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaGlobe size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Multi-angle vision
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Support for dual-camera scanning and 360° environmental room
                    inspection.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaVolumeUp size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Acoustic spatial filter
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Isolates ambient keyboard typing while instantly detecting
                    secondary whispers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaBolt size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Zero-install browser setup
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    100% web-based with WebAssembly acceleration. No invasive
                    desktop apps needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hardware Sensor Device */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              className={`relative rounded-3xl overflow-hidden border transition-all duration-300 group ${
                isDark
                  ? "bg-[#090b12] border-white/[0.12] shadow-2xl shadow-blue-950/50"
                  : "bg-white border-slate-200 shadow-xl shadow-slate-300/50"
              }`}
            >
              <img
                src={sensorDeviceImg}
                alt="AI Proctoring Sensor Device"
                className="w-full h-auto object-cover max-h-[420px] group-hover:scale-105 transition-transform duration-700"
              />
              <div
                className={`absolute inset-0 pointer-events-none ${
                  isDark
                    ? "bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent"
                    : "bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"
                }`}
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
                <span className="text-blue-400 flex items-center gap-1.5 font-bold">
                  <FaShieldAlt /> SENSOR_GRID: CALIBRATED
                </span>
                <span className="text-emerald-400">STATUS: OPTIMAL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= HIGHLIGHT SECTION 2: Constellation / Shared Universe ================= */}
      <section
        className={`py-28 relative overflow-hidden border-t transition-colors duration-300 ${
          isDark ? "border-white/[0.05]" : "border-slate-200"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Glowing Constellation Disc Network */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div
              className={`relative w-[320px] sm:w-[380px] h-[320px] sm:h-[380px] rounded-full border flex items-center justify-center transition-all ${
                isDark
                  ? "border-blue-500/25 bg-[#080a12] shadow-2xl shadow-blue-950/60"
                  : "border-blue-300 bg-white shadow-xl shadow-slate-200/80"
              }`}
            >
              {/* Radial glow background */}
              <div
                className={`absolute inset-8 rounded-full blur-xl pointer-events-none ${
                  isDark ? "bg-blue-600/10" : "bg-blue-400/15"
                }`}
              />
              <div
                className={`absolute inset-0 rounded-full border border-dashed animate-spin [animation-duration:40s] ${
                  isDark ? "border-blue-400/20" : "border-blue-500/30"
                }`}
              />

              {/* Central Glowing Core Node */}
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-400 font-bold text-xs shadow-lg shadow-blue-500/40 z-10">
                AI HUB
              </div>

              {/* Orbiting Candidate Avatar Nodes */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-emerald-500/30">
                  AS
                </div>
                <span className="text-[9px] font-mono text-emerald-500 font-semibold mt-1">
                  Priya (Live)
                </span>
              </div>

              <div className="absolute bottom-8 left-12 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-emerald-500/30">
                  RV
                </div>
                <span className="text-[9px] font-mono text-emerald-500 font-semibold mt-1">
                  Rahul (Live)
                </span>
              </div>

              <div className="absolute bottom-8 right-12 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-amber-500/30">
                  AK
                </div>
                <span className="text-[9px] font-mono text-amber-500 font-semibold mt-1">
                  Amit (Flag)
                </span>
              </div>

              <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                  SK
                </div>
                <span className="text-[9px] font-mono text-emerald-500 font-semibold mt-1">
                  Sara
                </span>
              </div>

              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                  NE
                </div>
                <span className="text-[9px] font-mono text-emerald-500 font-semibold mt-1">
                  Neha
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <span
              className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
                isDark ? "text-blue-400" : "text-blue-600"
              }`}
            >
              Live & Synchronized
            </span>
            <h2
              className={`text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              A unified surveillance grid
            </h2>
            <p
              className={`mt-4 text-xs sm:text-sm leading-relaxed max-w-xl ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Step into an interconnected proctoring hub that monitors global
              candidate cohorts with multi-examiner collaboration and real-time
              live telemetry.
            </p>

            {/* 2x2 Feature points */}
            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaUsers size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Candidate cohort streaming
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Supervise hundreds of candidate camera feeds on a
                    responsive low-bandwidth matrix.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaVideo size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Timestamped incident replay
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Review flagged infractions with automated 10-second
                    evidentiary video snippets.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaMobileAlt size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Smartphone dual-view
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Scan a QR code on candidate's mobile for secondary hands &
                    desk monitoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${
                    isDark
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      : "bg-blue-50 border-blue-200 text-blue-600"
                  }`}
                >
                  <FaFileContract size={13} />
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold tracking-tight ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    Autonomous report export
                  </h3>
                  <p
                    className={`text-[11px] mt-1 leading-relaxed ${
                      isDark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Download institution-ready PDF compliance audits with
                    cryptographically signed proof.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorks;