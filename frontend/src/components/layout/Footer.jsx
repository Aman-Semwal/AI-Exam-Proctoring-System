import { FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

const Footer = () => {
  const { isDark } = useTheme();

  return (
    <footer
      className={`transition-colors duration-300 border-t ${
        isDark
          ? "bg-[#030406] border-white/[0.06] text-slate-400"
          : "bg-slate-100 border-slate-200 text-slate-600"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div
              className={`flex items-center gap-2 font-bold text-base tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isDark
                    ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                    : "bg-blue-50 border border-blue-200 text-blue-600"
                }`}
              >
                <FaShieldAlt size={13} />
              </div>
              <span>
                Proctor<span className="text-blue-500">AI</span>
              </span>
            </div>

            <p
              className={`text-xs leading-relaxed max-w-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              An intelligent autonomous online examination proctoring ecosystem
              built for universities, certifiers, and enterprise platforms
              worldwide.
            </p>
          </div>

          {/* Products Column (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#features"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Neural Engine
                </a>
              </li>
              <li>
                <Link
                  to="/login"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Student Portal
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Admin Grid
                </Link>
              </li>
            </ul>
          </div>

          {/* About Column (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              About
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Our Mission
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Security & Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Academic Trust
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Research Papers
                </a>
              </li>
            </ul>
          </div>

          {/* Social Column (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4
              className={`text-xs font-semibold uppercase tracking-wider font-mono ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Social & Network
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  GitHub Ecosystem
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className={`transition ${
                    isDark
                      ? "hover:text-white"
                      : "hover:text-slate-900 text-slate-600"
                  }`}
                >
                  Discord Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] ${
            isDark
              ? "border-white/[0.05] text-slate-400"
              : "border-slate-200 text-slate-500"
          }`}
        >
          <p>© 2026 ProctorAI. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className={`transition ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className={`transition ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Terms of Service
            </a>
            <a
              href="#"
              className={`transition ${
                isDark ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              FERPA & GDPR Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;