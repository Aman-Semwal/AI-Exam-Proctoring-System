import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaShieldAlt, FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../services/api";

const InviteActivation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // If token is missing, show an error immediately — no form needed
  if (!token) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex items-center justify-center px-6">
        <div className="bg-[#121520] border border-white/7 rounded-2xl p-8 max-w-md w-full text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500 bg-blue-500/10 border border-blue-500/30">
              <FaShieldAlt size={17} />
            </div>
            <span className="font-bold text-lg text-white">
              Proctor<span className="text-blue-500">AI</span>
            </span>
          </div>

          <div className="text-4xl font-bold text-red-500 mb-4">⚠</div>
          <h1 className="text-xl font-bold text-white mb-2">Invalid Link</h1>
          <p className="text-slate-400 text-sm mb-6">
            Invalid or missing activation link. Please check your invitation
            email and try again.
          </p>
          <a
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/organizations/invitations/activate", {
        token,
        name: form.name,
        password: form.password,
      });

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      console.error("Activation error:", err);

      const status = err.response?.status;
      const message = err.response?.data?.message;

      if (status === 400 || status === 404) {
        setError(
          message ||
            "This activation link is invalid or has already expired. Please contact your administrator for a new invitation."
        );
      } else {
        setError(
          message || "Unable to activate account. Please try again later."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center px-6 py-12">
      <div className="bg-[#121520] border border-white/7 rounded-2xl p-8 max-w-md w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-blue-500 bg-blue-500/10 border border-blue-500/30">
            <FaShieldAlt size={17} />
          </div>
          <span className="font-bold text-lg text-white">
            Proctor<span className="text-blue-500">AI</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
          Activate your account
        </h1>
        <p className="text-sm text-slate-400 mb-7">
          Set your name and password to complete your account setup.
        </p>

        {/* Success state */}
        {success ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-emerald-500"
              >
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              Account Activated!
            </h2>
            <p className="text-sm text-slate-400">
              Account activated! Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="bg-[#0d0f17] border border-white/8 rounded-xl px-4 py-3 text-white text-sm w-full focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={8}
                  className="bg-[#0d0f17] border border-white/8 rounded-xl px-4 py-3 text-white text-sm w-full focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showPw ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  required
                  className="bg-[#0d0f17] border border-white/8 rounded-xl px-4 py-3 text-white text-sm w-full focus:outline-none focus:border-blue-500 transition placeholder:text-slate-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                >
                  {showConfirmPw ? (
                    <FaEyeSlash size={13} />
                  ) : (
                    <FaEye size={13} />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-xs px-3 py-2.5 rounded-xl text-red-400 bg-red-500/8 border border-red-500/20">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition shadow-md shadow-blue-500/20 active:scale-[0.97] mt-1"
            >
              {loading ? "Activating..." : "Activate Account →"}
            </button>
          </form>
        )}

        {/* Footer link */}
        {!success && (
          <p className="text-xs text-slate-600 text-center mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-blue-500 hover:underline">
              Sign in
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

export default InviteActivation;
