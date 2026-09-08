import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShieldAlt, FaEye, FaEyeSlash, FaGoogle,
  FaSun, FaMoon,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const ROLES = [
  { value: "student",      label: "Student Portal" },
  { value: "examiner",     label: "Examiner Panel" },
  { value: "proctor",      label: "Proctor Surveillance" },
  { value: "organization", label: "Organization Admin" },
  { value: "super-admin",  label: "Super Admin Control" },
];

const ROUTES = {
  student:      "/student/dashboard",
  examiner:     "/examiner/dashboard",
  proctor:      "/proctor/dashboard",
  organization: "/organization/dashboard",
  "super-admin":"/super-admin/dashboard",
};

const Login = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student");
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    navigate(ROUTES[role]);
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ===== LEFT PANEL — Branding ===== */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 w-[42%] shrink-0 relative overflow-hidden"
        style={{ background: "var(--bg-card)", borderRight: "1px solid var(--border)" }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(circle, #3b82f6 1px, transparent 1px)", backgroundSize: "2rem 2rem" }} />

        {/* Logo */}
        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
            <FaShieldAlt size={17} />
          </div>
          <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>
            Proctor<span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* Center Copy */}
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-extrabold tracking-tight leading-snug"
            style={{ color: "var(--text-primary)" }}>
            Examination integrity<br />
            <span className="text-blue-500">powered by AI</span>
          </h2>
          <p className="text-sm leading-relaxed max-w-xs" style={{ color: "var(--text-secondary)" }}>
            Secure, transparent, and fully automated online examination proctoring for institutions of any scale.
          </p>

          {/* Proof Points */}
          <div className="space-y-3">
            {[
              "99.9% Face Detection Accuracy",
              "Real-time Eye Tracking & Gaze Analysis",
              "AI-Generated Integrity Reports",
              "Multi-role Platform Support",
            ].map((pt) => (
              <div key={pt} className="flex items-center gap-2.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-emerald-500"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4L3 6L7 2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {pt}
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <p className="text-xs relative z-10" style={{ color: "var(--text-muted)" }}>
          "ProctorAI has transformed how we conduct remote assessments."<br />
          <span className="font-medium mt-0.5 block" style={{ color: "var(--text-secondary)" }}>
            — Academic Director, MM University
          </span>
        </p>
      </div>

      {/* ===== RIGHT PANEL — Form ===== */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">

        {/* Theme toggle (top-right) */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="absolute top-5 right-5 w-9 h-9 rounded-lg flex items-center justify-center transition"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: isDark ? "#fbbf24" : "#6366f1",
          }}
        >
          {isDark ? <FaSun size={14} /> : <FaMoon size={14} />}
        </button>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500"
              style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
              <FaShieldAlt size={13} />
            </div>
            <span className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Proctor<span className="text-blue-500">AI</span>
            </span>
          </div>

          {/* Toggle Tabs */}
          <div className="flex rounded-xl p-1 mb-8"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            {["Sign In", "Create Account"].map((tab, i) => {
              const active = isLogin === (i === 0);
              return (
                <button
                  key={tab}
                  onClick={() => setIsLogin(i === 0)}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition"
                  style={{
                    background: active ? "#2563eb" : "transparent",
                    color: active ? "#fff" : "var(--text-muted)",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: "var(--text-primary)" }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-secondary)" }}>
            {isLogin
              ? "Sign in to access your ProctorAI portal."
              : "Join ProctorAI and set up your academic profile."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Anchal Saini"
                  className="input-field w-full"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@university.edu"
                className="input-field w-full"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••••"
                  className="input-field w-full pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Portal Role
              </label>
              <select
                className="input-field w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Forgot (login only) */}
            {isLogin && (
              <div className="flex justify-end">
                <button type="button" className="text-xs text-blue-500 hover:underline">
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-md shadow-blue-500/20 active:scale-[0.97] mt-1"
            >
              {isLogin ? "Sign In to Dashboard →" : "Create Account →"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl text-sm font-medium transition"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <FaGoogle size={13} className="text-red-400" />
              Continue with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;