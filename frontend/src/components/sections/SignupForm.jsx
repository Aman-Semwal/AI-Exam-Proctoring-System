import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserShield } from "react-icons/fa";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("student");
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);

    if (selectedRole === "super-admin") navigate("/super-admin/dashboard");
    else if (selectedRole === "organization") navigate("/organization/dashboard");
    else if (selectedRole === "examiner") navigate("/examiner/dashboard");
    else if (selectedRole === "proctor") navigate("/proctor/dashboard");
    else navigate("/student/dashboard");
  };

  const handleGoogleSignup = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);
    navigate("/student/dashboard");
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900">Create your account</h2>
      <p className="text-gray-500 mt-2">Join ProctorAI and start your journey.</p>

      <form onSubmit={handleSignup} className="mt-6 space-y-4">

        {/* Role Selector */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <FaUserShield className="text-cyan-600" /> Register As
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
          >
            <option value="student">Student</option>
            <option value="examiner">Examiner</option>
            <option value="proctor">Proctor</option>
            <option value="organization">Organization Admin</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
          <input
            type="email"
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              required
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 transition"
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
        <label className="flex items-start gap-2 text-sm text-gray-500 pt-1">
          <input type="checkbox" required className="mt-1 accent-cyan-500" />
          <span>I agree to the Terms & Conditions and Privacy Policy.</span>
        </label>

        {/* Signup */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition shadow-md"
        >
          Create Account
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 font-medium flex items-center justify-center gap-3 transition"
        >
          <FaGoogle className="text-red-500" />
          Sign up with Google
        </button>

      </form>
    </div>
  );
};

export default SignupForm;