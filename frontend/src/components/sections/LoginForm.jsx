import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import api from "../services/api";

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      // Real backend login
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;

      // Save JWT
      localStorage.setItem("token", data.token);

      // Save user information
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: data.name,
          email: data.email,
          role: data.role,
          orgId: data.orgId,
          orgSlug: data.orgSlug,
        })
      );

      // Backend decides the role
      const role = data.role;

      // Navigate according to backend role
      if (role === "SUPER_ADMIN") {
        navigate("/super-admin/dashboard");
      } else if (role === "ORG_ADMIN") {
        navigate("/organization/dashboard");
      } else if (role === "EXAM_CREATOR") {
        navigate("/examiner/dashboard");
      } else if (role === "PROCTOR") {
        navigate("/proctor/dashboard");
      } else if (role === "STUDENT") {
        navigate("/student/dashboard");
      } else {
        setError("Invalid user role.");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError("Unable to connect to server. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("Google login is not connected yet.");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight">
        Welcome back
      </h2>

      <p className="text-xs text-slate-400 mt-1">
        Login to continue to your account.
      </p>

      <form onSubmit={handleLogin} className="mt-5 space-y-3.5">

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email Address
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Password */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs font-medium text-slate-300">
              Password
            </label>

            <button
              type="button"
              className="text-xs text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Error */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Remember */}
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-0.5">
          <input
            type="checkbox"
            className="accent-blue-600 rounded"
          />
          Remember me
        </label>

        {/* Login */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold text-xs transition shadow-sm"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-white/[0.06]" />

          <span className="text-slate-500 text-[10px] uppercase">
            OR
          </span>

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

