import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserShield } from "react-icons/fa";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);

    if (selectedRole === "super-admin") navigate("/super-admin/dashboard");
    else if (selectedRole === "organization") navigate("/organization/dashboard");
    else if (selectedRole === "examiner") navigate("/examiner/dashboard");
    else if (selectedRole === "proctor") navigate("/proctor/dashboard");
    else navigate("/student/dashboard");
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);
    navigate("/student/dashboard");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight">Welcome back</h2>
      <p className="text-xs text-slate-400 mt-1">Login to continue to your account.</p>

      <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
        {/* Role Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
            <FaUserShield className="text-blue-400 text-xs" /> Select Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs outline-none focus:border-blue-500 transition"
          >
            <option value="student">Student</option>
            <option value="examiner">Examiner</option>
            <option value="proctor">Proctor</option>
            <option value="organization">Organization Admin</option>
            <option value="super-admin">Super Admin</option>
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <button type="button" className="text-xs text-blue-400 hover:underline">Forgot password?</button>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
              className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Remember */}
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-0.5">
          <input type="checkbox" className="accent-blue-600 rounded" /> Remember me
        </label>

        {/* Login */}
        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-sm"
        >
          Login
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-slate-500 text-[10px] uppercase">OR</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] hover:bg-white/[0.04] text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition"
        >
          <FaGoogle className="text-red-400 text-xs" />
          Continue with Google
        </button>
      </form>
    </div>
  );
};

export default LoginForm;