import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-7xl sm:text-8xl font-black font-mono text-blue-500 tracking-tighter">
          404
        </h1>

        <h2 className="text-2xl font-bold text-white tracking-tight mt-4">
          Page Not Found
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
          The destination route you are attempting to reach does not exist or has been relocated.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-lg text-xs transition active:scale-[0.98] shadow-sm"
        >
          <FaArrowLeft size={11} />
          <span>Return Home</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;