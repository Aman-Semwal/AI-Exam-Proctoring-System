import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/sections/LoginForm";
import SignupForm from "../../components/sections/SignupForm";
import { FaShieldAlt, FaCheckCircle } from "react-icons/fa";

const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center px-4 py-8">

      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="fixed bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-6xl grid lg:grid-cols-2 overflow-hidden rounded-[2rem] border border-slate-700/60 bg-[#0b1220] shadow-2xl">

        {/* ================= LEFT ================= */}

        <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0b1220] border-r border-slate-700/60">

          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="cursor-pointer"
          >
            <h1 className="text-3xl font-extrabold text-white">
              Proctor
              <span className="text-cyan-400">AI</span>
            </h1>

            <p className="text-slate-400 text-sm mt-2">
              Secure online examination platform
            </p>
          </div>

          {/* Content */}
          <div>

            <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-7">
              <FaShieldAlt className="text-cyan-400 text-2xl" />
            </div>

            <h2 className="text-4xl font-bold text-white leading-tight">
              Welcome to a
              <br />

              <span className="text-cyan-400">
                smarter way to examine.
              </span>
            </h2>

            <p className="text-slate-400 mt-5 leading-7 max-w-md">
              Manage exams, monitor candidates and keep every
              assessment secure from one simple platform.
            </p>

            {/* Features */}
            <div className="mt-8 space-y-4">

              <div className="flex items-center gap-3 text-slate-300">
                <FaCheckCircle className="text-cyan-400" />
                Secure online examinations
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <FaCheckCircle className="text-cyan-400" />
                Easy exam management
              </div>

              <div className="flex items-center gap-3 text-slate-300">
                <FaCheckCircle className="text-cyan-400" />
                Real-time monitoring
              </div>

            </div>

          </div>

          {/* Footer */}
          <p className="text-slate-500 text-sm">
            © 2026 ProctorAI
          </p>

        </div>

        {/* ================= RIGHT ================= */}

        <div className="p-7 sm:p-10 lg:p-14 bg-[#111827]">

          {/* Toggle Header */}
          <div className="flex items-center justify-between mb-8">

            <div>
              <p className="text-slate-400 text-sm">
                {isSignup ? "New here?" : "Already a member?"}
              </p>

              <h3 className="text-xl font-bold text-white mt-1">
                {isSignup
                  ? "Create your account"
                  : "Sign in to continue"}
              </h3>
            </div>

            <button
              onClick={() => setIsSignup(!isSignup)}
              className="px-5 py-2.5 rounded-xl border border-cyan-400/40 text-cyan-400 hover:bg-cyan-400/10 transition font-medium"
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>

          </div>

          {/* ================= WHITE FORM ================= */}

          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl">

            {isSignup ? (
              <SignupForm />
            ) : (
              <LoginForm />
            )}

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;