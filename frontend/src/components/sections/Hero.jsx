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
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <section className="relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center text-center bg-[#050508]">
        {/* ================= Linear Grid Background ================= */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(59, 130, 246, 0.07) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59, 130, 246, 0.07) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 75% 65% at 50% 15%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 75% 65% at 50% 15%, black 40%, transparent 100%)",
          }}
        />

        {/* Subtle radial ambient blue light */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none z-0" />

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          {/* Top category sub-header */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 mb-6 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-blue-400 tracking-widest uppercase">
              Autonomous AI Proctoring
            </span>
          </div>

          {/* Huge Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            An infinite proctoring <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300">
              reality voyage
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Next-generation remote assessment surveillance with real-time biometric verification, neural eye gaze tracking, and automated academic integrity verification.
          </p>

          {/* Hero Visual Display with Glowing Ring Aura */}
          <div className="relative mt-12 w-full max-w-4xl px-4 flex justify-center">
            {/* Subtle Outer Glowing Halo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full border border-blue-500/30 bg-blue-500/5 blur-[2px] animate-pulse" />
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/[0.12] shadow-2xl shadow-blue-950/40 max-w-2xl bg-[#090a10]">
              <img
                src={heroCandidateImg}
                alt="AI Proctoring Candidate Telemetry"
                className="w-full h-auto object-cover max-h-[520px]"
              />
              {/* Ambient vignette gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent pointer-events-none" />

              {/* Live HUD telemetry pill overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>AI STREAM: ACTIVE</span>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-blue-400">
                <FaShieldAlt size={11} />
                <span>CONFIDENCE: 99.8%</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-3.5 mt-8">
            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3 rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/25 active:scale-95 flex items-center gap-2"
            >
              <span>Get Started</span>
              <FaArrowRight size={11} />
            </button>

            <button
              onClick={() => setShowDemo(true)}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.12] font-medium px-6 py-3 rounded-full text-xs uppercase tracking-wider transition flex items-center gap-2"
            >
              <FaPlay size={10} className="text-blue-400" />
              <span>Watch Demo</span>
            </button>
          </div>
        </div>

        {/* Logos Strip Row */}
        <div className="w-full max-w-6xl mx-auto px-6 mt-16 pt-8 border-t border-white/[0.06] relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-50 hover:opacity-75 transition-opacity">
            {partnerLogos.map((logo) => (
              <div key={logo.name} className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-slate-300">
                <span>{logo.icon}</span>
                <span>{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Holographic Manifesto Section */}
        <div className="max-w-3xl mx-auto px-6 mt-28 text-center relative z-10">
          {/* Hologram Crystal Icon */}
          <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
            <FaMicrochip size={24} className="text-blue-400" />
          </div>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed tracking-wide font-sans">
            We, the pioneers of the autonomous proctoring realm, rise with boundless determination to shape a new standard of academic trust. Guided by precision vision and neural telemetry, we embark on a transformative journey to eliminate exam compromise. We believe in the power of artificial intelligence to safeguard fairness and unlock infinite educational integrity.
          </p>
        </div>
      </section>

      {/* Interactive Demo Popup Modal */}
      {showDemo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[#0e1118] border border-white/[0.12] rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/[0.05] transition"
            >
              <FaTimes size={16} />
            </button>

            <div className="mb-6">
              <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-widest">
                Real-Time Diagnostics
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                How AI Proctoring Operates
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Autonomous multi-vector surveillance inspecting face landmarks, gaze angles, acoustic patterns, and browser integrity.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#07090e] rounded-2xl border border-white/[0.07] p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <FaCamera size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Biometric Face ID</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Continuously verifies candidate presence and detects multiple faces in frame.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <FaCheckCircle size={9} /> 99.8% ACCURACY
                </div>
              </div>

              <div className="bg-[#07090e] rounded-2xl border border-white/[0.07] p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <FaEye size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Neural Eye Tracking</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Gaze deviation radar flags off-screen cheat sheets, phones, or side monitors.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <FaCheckCircle size={9} /> 3D VECTOR MESH
                </div>
              </div>

              <div className="bg-[#07090e] rounded-2xl border border-white/[0.07] p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <FaLock size={18} />
                </div>
                <h3 className="text-sm font-semibold text-white">Lockdown Guard</h3>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                  Detects tab switching, secondary displays, clipboard pasting, and background voices.
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  <FaShieldAlt size={9} /> SYSTEM SECURE
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDemo(false);
                navigate("/login");
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
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