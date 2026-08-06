import { FaRobot } from "react-icons/fa";

const LoginIllustration = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center">

      <div className="w-56 h-56 rounded-full bg-cyan-500/10 border border-cyan-400 flex items-center justify-center">
        <FaRobot className="text-cyan-400 text-8xl" />
      </div>

      <h2 className="text-5xl font-bold text-white mt-10 text-center">
        AI Exam
        <span className="text-cyan-400"> Proctoring</span>
      </h2>

      <p className="text-gray-400 mt-6 text-center max-w-md leading-8">
        Secure, Smart and AI Powered Online Examination Platform with
        Face Detection, Eye Tracking and Live Monitoring.
      </p>

    </div>
  );
};

export default LoginIllustration;