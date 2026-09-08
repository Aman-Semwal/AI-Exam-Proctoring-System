import { FaShieldAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#030406] border-t border-white/[0.06] text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-base tracking-tight">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <FaShieldAlt size={13} />
              </div>
              <span>Proctor<span className="text-blue-400">AI</span></span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              An intelligent autonomous online examination proctoring ecosystem built for universities, certifiers, and enterprise platforms worldwide.
            </p>
          </div>

          {/* Products Column (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
              Products
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition">Neural Engine</a></li>
              <li><Link to="/login" className="hover:text-white transition">Student Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Admin Grid</Link></li>
            </ul>
          </div>

          {/* About Column (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
              About
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition">Our Mission</a></li>
              <li><a href="#" className="hover:text-white transition">Security & Privacy</a></li>
              <li><a href="#" className="hover:text-white transition">Academic Trust</a></li>
              <li><a href="#" className="hover:text-white transition">Research Papers</a></li>
            </ul>
          </div>

          {/* Social Column (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider font-mono">
              Social & Network
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition">Twitter / X</a></li>
              <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
              <li><a href="#" className="hover:text-white transition">GitHub Ecosystem</a></li>
              <li><a href="#" className="hover:text-white transition">Discord Community</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 ProctorAI. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <a href="#" className="hover:text-white transition">FERPA & GDPR Compliance</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;