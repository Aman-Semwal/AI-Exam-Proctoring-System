import {
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";

import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      id="contact"
      className="bg-[#020617] border-t border-white/10"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">

        <div className="grid md:grid-cols-3 gap-10">

          {/* Logo */}
          <div>

            <Link to="/">
              <h2 className="text-3xl font-bold text-white cursor-pointer">
                Proctor<span className="text-cyan-400">AI</span>
              </h2>
            </Link>

            <p className="text-gray-400 mt-4">
              AI-powered online examination monitoring system for secure,
              transparent, and fair online exams.
            </p>

          </div>

          {/* Quick Links */}
          <div>

            <h3 className="text-white font-semibold text-xl mb-4">
              Quick Links
            </h3>

            <ul className="space-y-3 text-gray-400">

              <li>
                <a href="/" className="hover:text-cyan-400 transition">
                  Home
                </a>
              </li>

              <li>
                <a href="#features" className="hover:text-cyan-400 transition">
                  Features
                </a>
              </li>

              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-cyan-400 transition"
                >
                  How It Works
                </a>
              </li>

              <li>
                <a href="#contact" className="hover:text-cyan-400 transition">
                  Contact
                </a>
              </li>

            </ul>

          </div>

          {/* Social Icons */}
          <div>

            <h3 className="text-white font-semibold text-xl mb-4">
              Connect With Us
            </h3>

            <div className="flex gap-5 text-2xl text-gray-400">

              <FaGithub className="hover:text-cyan-400 cursor-pointer transition" />

              <FaLinkedin className="hover:text-cyan-400 cursor-pointer transition" />

              <FaInstagram className="hover:text-cyan-400 cursor-pointer transition" />

              <FaEnvelope className="hover:text-cyan-400 cursor-pointer transition" />

            </div>

          </div>

        </div>

        <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-500">
          © 2026 ProctorAI. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;