import {
  FaRobot,
  FaCheckCircle,
} from "react-icons/fa";

const AIStatusCard = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

      <div className="flex items-center gap-4">

        <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center">

          <FaRobot
            className="text-cyan-400"
            size={28}
          />

        </div>

        <div>

          <h2 className="text-white text-xl font-bold">
            AI Monitoring
          </h2>

          <p className="text-gray-400">
            System Status
          </p>

        </div>

      </div>

      <div className="mt-8 space-y-4">

        <div className="flex justify-between">

          <span className="text-gray-400">
            Face Detection
          </span>

          <span className="text-green-400 flex items-center gap-2">

            <FaCheckCircle />

            Active

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Eye Tracking
          </span>

          <span className="text-green-400 flex items-center gap-2">

            <FaCheckCircle />

            Active

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Voice Monitoring
          </span>

          <span className="text-green-400 flex items-center gap-2">

            <FaCheckCircle />

            Active

          </span>

        </div>

        <div className="flex justify-between">

          <span className="text-gray-400">
            Tab Switching
          </span>

          <span className="text-green-400 flex items-center gap-2">

            <FaCheckCircle />

            Active

          </span>

        </div>

      </div>

    </div>
  );
};

export default AIStatusCard;