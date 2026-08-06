import { FaRobot } from "react-icons/fa";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-50">

      <div className="text-center">

        <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse mx-auto">

          <FaRobot
            size={45}
            className="text-cyan-400"
          />

        </div>

        <h2 className="text-white text-3xl font-bold mt-8">
          ProctorAI
        </h2>

        <p className="text-gray-400 mt-3">
          Loading Dashboard...
        </p>

      </div>

    </div>
  );
};

export default LoadingScreen;