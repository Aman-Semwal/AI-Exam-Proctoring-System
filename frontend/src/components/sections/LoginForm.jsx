import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleLogin = () => {
    // Backend connect hone ke baad login validation yaha hoga

    localStorage.setItem("isLoggedIn", "true");

    navigate("/student/dashboard");
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-10 shadow-2xl">

      <h2 className="text-4xl font-bold text-white">
        Welcome Back 👋
      </h2>

      <p className="text-gray-400 mt-3">
        Login to continue to your dashboard.
      </p>

      <div className="mt-8 space-y-6">

        {/* Email */}

        <input
          type="email"
          placeholder="Email Address"
          className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-4 text-white outline-none focus:border-cyan-400"
        />

        {/* Password */}

        <div className="relative">

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-4 pr-14 text-white outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>

        </div>

        {/* Remember */}

        <div className="flex justify-between items-center text-sm">

          <label className="flex items-center gap-2 text-gray-300">

            <input type="checkbox" />

            Remember Me

          </label>

          <button className="text-cyan-400 hover:underline">
            Forgot Password?
          </button>

        </div>

        {/* Login */}

        <button
          onClick={handleLogin}
          className="w-full bg-cyan-500 hover:bg-cyan-400 py-4 rounded-xl font-bold text-black transition"
        >
          Login
        </button>

        {/* Divider */}

        <div className="flex items-center gap-4">

          <div className="flex-1 h-px bg-gray-700"></div>

          <span className="text-gray-400 text-sm">
            OR
          </span>

          <div className="flex-1 h-px bg-gray-700"></div>

        </div>

        {/* Google */}

        <button className="w-full border border-gray-700 py-4 rounded-xl text-white flex items-center justify-center gap-3 hover:border-cyan-400 transition">

          <FaGoogle />

          Continue with Google

        </button>

        {/* Back */}

        <p className="text-center text-gray-400">

          Don't have an account?{" "}

          <button
            onClick={() => navigate("/")}
            className="text-cyan-400 hover:underline"
          >
            Back to Home
          </button>

        </p>

      </div>

    </div>
  );
};

export default LoginForm;