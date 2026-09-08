import { FaShieldAlt } from "react-icons/fa";

const LoginIllustration = () => {
  return (
    <div className="hidden lg:flex flex-col justify-center items-center text-center p-8">
      <div className="w-32 h-32 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mb-8 shadow-xl">
        <FaShieldAlt className="text-blue-400 text-5xl" />
      </div>

      <h2 className="text-3xl font-bold text-white tracking-tight">
        AI Exam <span className="text-blue-400">Proctoring</span>
      </h2>

      <p className="text-slate-400 mt-4 text-xs max-w-sm leading-relaxed">
        Secure, Smart and AI Powered Online Examination Platform with Face Detection, Eye Tracking and Live Monitoring.
      </p>
    </div>
  );
};

export default LoginIllustration;