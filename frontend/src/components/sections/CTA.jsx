import { useNavigate } from "react-router-dom";
import { FaArrowRight } from "react-icons/fa";
import laserWarpImg from "../../assets/laser-warp.jpg";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="relative py-28 bg-[#050508] overflow-hidden flex items-center justify-center">
      {/* Background Laser Warp Wallpaper */}
      <div className="absolute inset-0 flex items-center justify-center opacity-60">
        <img
          src={laserWarpImg}
          alt="Laser Warp Cyber Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050508] via-transparent to-[#050508]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 w-full text-center">
        {/* Floating Frosted Glass Action Card */}
        <div className="bg-[#0b0e17]/85 backdrop-blur-2xl border border-white/[0.14] rounded-3xl p-8 sm:p-14 shadow-2xl shadow-blue-950/80 max-w-2xl mx-auto">
          <span className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-widest">
            Start Today
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-2">
            Experience the best
          </h2>

          <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Discover the transformative power of autonomous proctoring. Secure your assessments now and unlock a world of infinite academic credibility.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate("/login")}
              className="bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.14] font-medium px-6 py-2.5 rounded-full text-xs uppercase tracking-wider transition"
            >
              System Docs
            </button>

            <button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-2.5 rounded-full text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 active:scale-95"
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