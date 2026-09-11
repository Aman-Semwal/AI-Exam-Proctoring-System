import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";
import laserWarpImg from "../../assets/laser-warp.jpg";

const CTA = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  return (
    <section
      className={`relative py-28 overflow-hidden flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-[#050508]" : "bg-slate-50"
      }`}
    >
      {/* Background Laser Warp Wallpaper */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isDark ? "opacity-60" : "opacity-30"
        }`}
      >
        <img
          src={laserWarpImg}
          alt="Laser Warp Cyber Background"
          className="w-full h-full object-cover"
        />
        {/* Dynamic Gradient Overlay */}
        <div
          className={`absolute inset-0 ${
            isDark
              ? "bg-gradient-to-b from-[#050508] via-transparent to-[#050508]"
              : "bg-gradient-to-b from-slate-50 via-slate-50/40 to-slate-50"
          }`}
        />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 w-full text-center">
        {/* Floating Frosted Glass Action Card */}
        <div
          className={`backdrop-blur-2xl border rounded-3xl p-8 sm:p-14 max-w-2xl mx-auto transition-all duration-300 ${
            isDark
              ? "bg-[#0b0e17]/85 border-white/[0.14] shadow-2xl shadow-blue-950/80"
              : "bg-white/80 border-slate-200/80 shadow-2xl shadow-slate-300/50"
          }`}
        >
          <span
            className={`text-[11px] font-mono font-semibold uppercase tracking-widest ${
              isDark ? "text-blue-400" : "text-blue-600"
            }`}
          >
            Start Today
          </span>

          <h2
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Experience the best
          </h2>

          <p
            className={`mt-3 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Discover the transformative power of autonomous proctoring. Secure
            your assessments now and unlock a world of infinite academic
            credibility.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate("/docs")}
              className={`font-medium px-6 py-2.5 rounded-full text-xs uppercase tracking-wider transition cursor-pointer border ${
                isDark
                  ? "bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border-white/[0.14]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300"
              }`}
            >
              System Docs
            </button>

            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-2.5 rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Get Started</span>
              <FaArrowRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;