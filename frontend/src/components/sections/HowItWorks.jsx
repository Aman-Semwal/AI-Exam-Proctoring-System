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
import sensorDeviceImg from "../../assets/sensor-device.jpg";

const HowItWorks = () => {
  return (
    <div className="bg-[#050508] text-white">
      {/* ================= HIGHLIGHT SECTION 1: Captivating Security ================= */}
      <section className="py-28 relative overflow-hidden border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & 2x2 Feature points */}
          <div className="lg:col-span-7">
            <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-widest">
              High Precision
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-white">
              Uncompromising vigilance
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              A new era of intelligent examination surveillance where institutions supervise online exams effortlessly, false flags are eradicated, and trust is restored.
            </p>

            {/* 2x2 Feature points grid */}
            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaSlidersH size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Adjustable thresholds
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Customizable tolerance for face deviations, eye gaze angles, and noise levels.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaGlobe size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Multi-angle vision
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Support for dual-camera scanning and 360° environmental room inspection.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaVolumeUp size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Acoustic spatial filter
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Isolates ambient keyboard typing while instantly detecting secondary whispers.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaBolt size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Zero-install browser setup
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    100% web-based with WebAssembly acceleration. No invasive desktop apps needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Hardware Sensor Device with Blue Light Streaks */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] bg-[#090b12] shadow-2xl shadow-blue-950/50 group">
              <img
                src={sensorDeviceImg}
                alt="AI Proctoring Sensor Device"
                className="w-full h-auto object-cover max-h-[420px] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent pointer-events-none" />
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
      <section className="py-28 relative overflow-hidden border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Glowing Constellation Disc Network */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div className="relative w-[320px] sm:w-[380px] h-[320px] sm:h-[380px] rounded-full border border-blue-500/25 bg-[#080a12] flex items-center justify-center shadow-2xl shadow-blue-950/60">
              {/* Radial glow background */}
              <div className="absolute inset-8 rounded-full bg-blue-600/10 blur-xl pointer-events-none" />
              <div className="absolute inset-0 rounded-full border border-dashed border-blue-400/20 animate-spin [animation-duration:40s]" />

              {/* Central Glowing Core Node */}
              <div className="w-16 h-16 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300 font-bold text-xs shadow-lg shadow-blue-500/40 z-10">
                AI HUB
              </div>

              {/* Orbiting Candidate Avatar Nodes */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-emerald-500/30">
                  AS
                </div>
                <span className="text-[9px] font-mono text-emerald-400 mt-1">Priya (Live)</span>
              </div>

              <div className="absolute bottom-8 left-12 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-emerald-500/30">
                  RV
                </div>
                <span className="text-[9px] font-mono text-emerald-400 mt-1">Rahul (Live)</span>
              </div>

              <div className="absolute bottom-8 right-12 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-amber-500/30">
                  AK
                </div>
                <span className="text-[9px] font-mono text-amber-400 mt-1">Amit (Flag)</span>
              </div>

              <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                  SK
                </div>
                <span className="text-[9px] font-mono text-emerald-400 mt-1">Sara</span>
              </div>

              <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center">
                <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-white text-[10px] font-bold">
                  NE
                </div>
                <span className="text-[9px] font-mono text-emerald-400 mt-1">Neha</span>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-widest">
              Live & Synchronized
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mt-2 text-white">
              A unified surveillance grid
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xl">
              Step into an interconnected proctoring hub that monitors global candidate cohorts with multi-examiner collaboration and real-time live telemetry.
            </p>

            {/* 2x2 Feature points */}
            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaUsers size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Candidate cohort streaming
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Supervise hundreds of candidate camera feeds on a responsive low-bandwidth matrix.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaVideo size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Timestamped incident replay
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Review flagged infractions with automated 10-second evidentiary video snippets.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaMobileAlt size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Smartphone dual-view
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Scan a QR code on candidate's mobile for secondary hands & desk monitoring.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FaFileContract size={13} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-tight">
                    Autonomous report export
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Download institution-ready PDF compliance audits with cryptographically signed proof.
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