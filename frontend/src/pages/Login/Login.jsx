import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaUserShield, FaEye, FaEyeSlash, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

export default function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("student");
  
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);

    if (selectedRole === "super-admin") navigate("/super-admin/dashboard");
    else if (selectedRole === "organization") navigate("/organization/dashboard");
    else if (selectedRole === "examiner") navigate("/examiner/dashboard");
    else if (selectedRole === "proctor") navigate("/proctor/dashboard");
    else navigate("/student/dashboard");
  };

  const handleGoogleAuth = () => {
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userRole", selectedRole);
    navigate("/student/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Wrapper */}
      <div className="w-full max-w-5xl grid lg:grid-cols-12 rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* ================= LEFT BRANDING PANEL (5 Cols) ================= */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-slate-950/80 to-slate-900/40 border-r border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-8 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <FaShieldAlt className="text-cyan-400 text-lg" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                Proctor<span className="text-cyan-400">AI</span>
              </span>
            </div>

            <h2 className="text-3xl font-extrabold leading-tight text-white mb-4">
              Secure automated <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">examination platform.</span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Advanced role-based monitoring and secure assessment environment built for institutions.
            </p>
          </div>

          <div className="space-y-3 my-8">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <FaCheckCircle className="text-cyan-400 shrink-0" /> AI-powered live proctoring & analytics
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <FaCheckCircle className="text-cyan-400 shrink-0" /> Multi-role secure access dashboards
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <FaCheckCircle className="text-cyan-400 shrink-0" /> Seamless exam creation & management
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-white/5 pt-4">
            © 2026 ProctorAI Enterprise Suite
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (7 Cols) ================= */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          
          {/* Header & Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold text-white">
                {isSignup ? "Create Account" : "Welcome Back"}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isSignup ? "Fill in details to get started" : "Please enter your credentials"}
              </p>
            </div>

            {/* Switch Mode Button */}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-cyan-400 transition"
            >
              {isSignup ? "Existing User? Login" : "New? Register"}
            </button>
          </div>

          {/* Google Auth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl transition duration-300 flex items-center justify-center gap-3 text-sm mb-6 shadow-sm"
          >
            <FaGoogle className="text-red-400" />
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center mb-6">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[11px] text-slate-500 uppercase tracking-widest">or continue with email</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          {/* Core Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Selection Dropdown */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <FaUserShield className="text-cyan-400" /> Select User Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="student" className="bg-slate-900 text-white">Student Portal</option>
                <option value="examiner" className="bg-slate-900 text-white">Examiner Dashboard</option>
                <option value="proctor" className="bg-slate-900 text-white">Proctor Surveillance</option>
                <option value="organization" className="bg-slate-900 text-white">Organization Admin</option>
                <option value="super-admin" className="bg-slate-900 text-white">Super Admin</option>
              </select>
            </div>

            {/* Full Name (Only visible on Signup) */}
            {isSignup && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                  <FaUser className="text-cyan-400" /> Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={isSignup}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-2">
                <FaEnvelope className="text-cyan-400" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@institution.edu"
                required
                className="w-full px-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-2">
                  <FaLock className="text-cyan-400" /> Password
                </label>
                {!isSignup && (
                  <button type="button" className="text-xs text-cyan-400 hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-3 pr-12 bg-slate-950/60 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 text-sm"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition duration-300 shadow-lg shadow-cyan-500/20 mt-2 text-sm"
            >
              {isSignup ? "Create Account" : "Sign In to Dashboard"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}