import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
} from "react-icons/fa";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleSignup = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", "student");

    navigate("/student/dashboard");
  };

  return (
    <div>

      <h2 className="text-3xl font-bold text-slate-900">
        Create your account
      </h2>

      <p className="text-gray-500 mt-2">
        Join ProctorAI and start your journey.
      </p>

      <div className="mt-8 space-y-5">

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your full name"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Password
          </label>

          <div className="relative">

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              className="w-full px-4 py-3.5 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>

          </div>
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm text-gray-500">

          <input
            type="checkbox"
            className="mt-1 accent-cyan-500"
          />

          <span>
            I agree to the Terms & Conditions and Privacy Policy.
          </span>

        </label>

        {/* Signup */}
        <button
          onClick={handleSignup}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition"
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">

          <div className="flex-1 h-px bg-gray-200" />

          <span className="text-gray-400 text-sm">
            OR
          </span>

          <div className="flex-1 h-px bg-gray-200" />

        </div>

        {/* Google */}
        <button
          type="button"
          className="w-full py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 font-medium flex items-center justify-center gap-3 transition"
        >
          <FaGoogle className="text-red-500" />

          Sign up with Google
        </button>

      </div>

    </div>
  );
};

export default SignupForm;