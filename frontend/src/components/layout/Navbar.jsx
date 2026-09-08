import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaSun, FaMoon, FaBars, FaTimes } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { label: "Overview", href: "#" },
    { label: "Features", href: "#features" },
    { label: "Surveillance", href: "#how-it-works" },
    { label: "Integrations", href: "#features" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#050508]/80 backdrop-blur-xl border-b border-white/[0.08] transition-colors">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shadow-lg shadow-blue-500/20">
            <FaShieldAlt size={15} />
          </div>
          <span className="font-bold text-base text-white tracking-tight">
            Proctor<span className="text-blue-400">AI</span>
          </span>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white transition"
          >
            {isDark ? <FaSun size={12} className="text-amber-400" /> : <FaMoon size={12} className="text-blue-400" />}
          </button>

          {/* Sign In button */}
          <button
            onClick={() => navigate("/login")}
            className="hidden sm:inline-block text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 transition"
          >
            Sign In
          </button>

          {/* Pill CTA button */}
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 sm:px-5 py-2 rounded-full text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 active:scale-95"
          >
            Get Started
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-white p-1 ml-1"
          >
            {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0c14] border-b border-white/[0.08] px-6 py-4 space-y-3">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-xs font-medium text-slate-300 hover:text-white py-1"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;