import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaPlay,
  FaTimes,
  FaShieldAlt,
  FaEye,
  FaCamera,
  FaCheckCircle,
  FaMicrochip,
  FaLock,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import heroCandidateImg from "../../assets/hero-proctor.jpg";

const partnerLogos = [
  { name: "OPENCV", icon: "👁️" },
  { name: "TENSORFLOW", icon: "🧠" },
  { name: "WEBRTC", icon: "⚡" },
  { name: "PYTORCH", icon: "🔥" },
  { name: "AWS CLOUD", icon: "☁️" },
  { name: "STANFORD AI", icon: "🎓" },
];

const Hero = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <section
        className={`relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center text-center transition-colors duration-300 ${
          isDark ? "bg-[#050508] text-white" : "bg-slate-50 text-slate-900"
        }`}
      >
        {/* Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, ${
                isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(0, 0, 0, 0.05)"
              } 1px, transparent 1px),
              linear-gradient(to bottom, ${
                isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(0, 0, 0, 0.05)"
              } 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse 75% 65% at 50% 15%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 65% at 50% 15%, black 40%, transparent 100%)",
          }}
        />

        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[150px] pointer-events-none z-0 ${
            isDark ? "bg-blue-600/15" : "bg-blue-400/20"
          }`}
        />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full border mb-6 backdrop-blur-md ${
              isDark
                ? "bg-blue-500/10 border-blue-500/25"
                : "bg-blue-100/80 border-blue-200"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span
              className={`text-[11px] font-mono font-medium tracking-widest uppercase ${
                isDark ? "text-blue-400" : "text-blue-700"
              }`}
            >
              Autonomous AI Proctoring
            </span>
          </div>

          <h1
            className={`text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            An infinite proctoring <br className="hidden sm:inline" />
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r ${
                isDark
                  ? "from-blue-400 via-indigo-300 to-sky-300"
                  : "from-blue-600 via-indigo-600 to-sky-600"
              }`}
            >
              reality voyage
            </span>
          </h1>

          <p
            className={`mt-6 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Next-generation remote assessment surveillance with real-time
            biometric verification, neural eye gaze tracking, and automated
            academic integrity verification.
          </p>

          <div className="relative mt-12 w-full max-w-4xl px-4 flex justify-center mx-auto">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border bg-blue-500/5 blur-[2px] animate-pulse ${
                  isDark ? "border-blue-500/30" : "border-blue-300"
                }`}
              />
            </div>

            <div
              className={`relative rounded-3xl overflow-hidden border shadow-2xl max-w-2xl ${
                isDark
                  ? "border-white/[0.12] shadow-blue-950/40 bg-[#090a10]"
                  : "border-slate-200 shadow-slate-300/50 bg-white"
              }`}
            >
              <img
                src={heroCandidateImg}
                alt="AI Proctoring Candidate Telemetry"
                className="w-full h-auto object-cover max-h-[520px]"
              />
              <div
                className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t pointer-events-none ${
                  isDark
                    ? "from-[#050508] via-[#050508]/60 to-transparent"
                    : "from-slate-50 via-slate-50/60 to-transparent"
                }`}
              />

              <div
                className={`absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-mono shadow-sm ${
                  isDark
                    ? "bg-black/60 border-white/10 text-emerald-400"
                    : "bg-white/80 border-slate-200 text-emerald-600"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI STREAM: ACTIVE</span>
              </div>

              <div
                className={`absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[11px] font-mono shadow-sm ${
                  isDark
                    ? "bg-black/60 border-white/10 text-blue-400"
                    : "bg-white/80 border-slate-200 text-blue-600"
                }`}
              >
                <FaShieldAlt size={11} />
                <span>CONFIDENCE: 99.8%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3.5 mt-8">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <FaArrowRight size={11} />
            </button>

            <button
              onClick={() => setShowDemo(true)}
              className={`font-medium px-6 py-3 rounded-full text-xs uppercase tracking-wider transition flex items-center gap-2 border cursor-pointer ${
                isDark
                  ? "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border-white/[0.12]"
                  : "bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-300 shadow-sm"
              }`}
            >
              <FaPlay
                size={10}
                className={isDark ? "text-blue-400" : "text-blue-600"}
              />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Logos Strip Row */}
        <div
          className={`w-full max-w-6xl mx-auto px-6 mt-16 pt-8 border-t relative z-10 ${
            isDark ? "border-white/[0.06]" : "border-slate-200"
          }`}
        >
          <div
            className={`flex flex-wrap items-center justify-center gap-8 sm:gap-14 transition-opacity ${
              isDark
                ? "opacity-60 hover:opacity-90"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            {partnerLogos.map((logo) => (
              <div
                key={logo.name}
                className={`flex items-center gap-2 text-xs font-mono font-bold tracking-widest ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                <span>{logo.icon}</span>
                <span>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holographic Manifesto Section */}
        <div className="max-w-3xl mx-auto px-6 mt-28 text-center relative z-10">
          <div
            className={`w-14 h-14 mx-auto mb-6 rounded-2xl border flex items-center justify-center shadow-lg ${
              isDark
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/10"
                : "bg-blue-50 border-blue-200 text-blue-600 shadow-blue-500/5"
            }`}
          >
            <FaMicrochip size={24} />
          </div>

          <p
            className={`text-sm sm:text-base font-normal leading-relaxed tracking-wide font-sans ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            We, the pioneers of the autonomous proctoring realm, rise with
            boundless determination to shape a new standard of academic trust.
            Guided by precision vision and neural telemetry, we embark on a
            transformative journey to eliminate exam compromise. We believe in
            the power of artificial intelligence to safeguard fairness and
            unlock infinite educational integrity.
          </p>
        </div>
      </section>

      {/* Demo Modal */}
      {showDemo && (
        <div
          className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
            isDark ? "bg-black/85" : "bg-slate-900/50"
          }`}
        >
          <div
            className={`relative w-full max-w-3xl border rounded-3xl p-6 sm:p-8 shadow-2xl transition-all ${
              isDark
                ? "bg-[#0e1118] border-white/[0.12] text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            <button
              onClick={() => setShowDemo(false)}
              className={`absolute top-5 right-5 p-2 rounded-lg transition cursor-pointer ${
                isDark
                  ? "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              <FaTimes size={16} />
            </button>

            <div className="mb-6">
              <span
                className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
                  isDark ? "text-blue-400" : "text-blue-600"
                }`}
              >
                Real-Time Diagnostics
              </span>
              <h2 className="text-2xl font-bold mt-1">
                How AI Proctoring Operates
              </h2>
              <p
                className={`text-xs sm:text-sm mt-1 ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Autonomous multi-vector surveillance inspecting face landmarks,
                gaze angles, acoustic patterns, and browser integrity.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div
                className={`rounded-2xl border p-5 text-center ${
                  isDark
                    ? "bg-[#07090e] border-white/[0.07]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <FaCamera size={18} />
                </div>
                <h3 className="text-sm font-semibold">Biometric Face ID</h3>
                <p
                  className={`text-xs mt-1.5 leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Continuously verifies candidate presence and detects multiple
                  faces in frame.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <FaCheckCircle size={9} /> 99.8% ACCURACY
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 text-center ${
                  isDark
                    ? "bg-[#07090e] border-white/[0.07]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <FaEye size={18} />
                </div>
                <h3 className="text-sm font-semibold">Neural Eye Tracking</h3>
                <p
                  className={`text-xs mt-1.5 leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Gaze deviation radar flags off-screen cheat sheets, phones, or
                  side monitors.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <FaCheckCircle size={9} /> 3D VECTOR MESH
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 text-center ${
                  isDark
                    ? "bg-[#07090e] border-white/[0.07]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-3">
                  <FaLock size={18} />
                </div>
                <h3 className="text-sm font-semibold">Lockdown Guard</h3>
                <p
                  className={`text-xs mt-1.5 leading-relaxed ${
                    isDark ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Detects tab switching, secondary displays, clipboard pasting,
                  and background voices.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  <FaShieldAlt size={9} /> SYSTEM SECURE
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDemo(false);
                navigate("/login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <span>Access Assessment Portal</span>
              <FaArrowRight size={12} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Hero;