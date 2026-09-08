import { FaShieldAlt } from "react-icons/fa";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#090a0f] flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center animate-pulse mx-auto shadow-xl">
          <FaShieldAlt
            size={28}
            className="text-blue-400"
          />
        </div>

        <h2 className="text-white text-lg font-bold mt-5 tracking-tight">
          Proctor<span className="text-blue-400">AI</span>
        </h2>

        <p className="text-slate-500 text-xs mt-1.5 font-medium">
          Loading system telemetry...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;