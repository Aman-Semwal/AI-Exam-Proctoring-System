import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaGoogle, FaUserShield } from "react-icons/fa";
import api from "../../services/api";

const SignupForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("STUDENT");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: selectedRole,
      });

      const data = response?.data?.data;

      // If backend returns token after registration
      if (data?.token) {
        localStorage.setItem("token", data.token);

        localStorage.setItem(
          "user",
          JSON.stringify({
            name: data.name || formData.name,
            email: data.email || formData.email,
            role: data.role || selectedRole,
            orgId: data.orgId || null,
            orgSlug: data.orgSlug || null,
          })
        );

        // Navigate according to backend role
        switch (data.role || selectedRole) {
          case "SUPER_ADMIN":
            navigate("/super-admin/dashboard");
            break;

          case "ORG_ADMIN":
            navigate("/organization/dashboard");
            break;

          case "EXAM_CREATOR":
            navigate("/examiner/dashboard");
            break;

          case "PROCTOR":
            navigate("/proctor/dashboard");
            break;

          default:
            navigate("/student/dashboard");
        }
      } else {
        // If registration succeeds but backend does not auto-login
        navigate("/login", {
          state: {
            message: "Account created successfully. Please login.",
          },
        });
      }
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setError("Google signup is not connected yet.");
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight">
        Create your account
      </h2>

      <p className="text-xs text-slate-400 mt-1">
        Join ProctorAI and start your journey.
      </p>

      {error && (
        <div className="mt-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="mt-5 space-y-3.5">
        {/* Role Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
            <FaUserShield className="text-blue-400 text-xs" />
            Register As
          </label>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs outline-none focus:border-blue-500 transition"
          >
            <option value="STUDENT">Student</option>
            <option value="EXAM_CREATOR">Examiner</option>
            <option value="PROCTOR">Proctor</option>
            <option value="ORG_ADMIN">Organization Admin</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Full Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Email Address
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
            className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] text-slate-200 text-xs placeholder-slate-500 outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
              minLength={6}
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

        {/* Terms */}
        <label className="flex items-start gap-2 text-xs text-slate-400 pt-0.5 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-0.5 accent-blue-600 rounded"
          />

          <span>
            I agree to the Terms & Conditions and Privacy Policy.
          </span>
        </label>

        {/* Signup */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-xs transition shadow-sm"
        >
          {loading ? "Creating Account..." : "Create Account"}
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
          onClick={handleGoogleSignup}
          className="w-full py-2.5 rounded-lg border border-white/[0.08] bg-[#090a0f] hover:bg-white/[0.04] text-slate-200 text-xs font-medium flex items-center justify-center gap-2.5 transition"
        >
          <FaGoogle className="text-red-400 text-xs" />
          Sign up with Google
        </button>
      </form>
    </div>
  );
};

export default SignupForm;