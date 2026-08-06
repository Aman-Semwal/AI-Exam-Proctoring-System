import { useState } from "react";
import { Link } from "react-router-dom";
import { HiMenuAlt3, HiX } from "react-icons/hi";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-xl bg-black/30 border-b border-white/10">

      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">

          <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center font-bold text-black">
            AI
          </div>

          <h1 className="text-2xl font-bold text-white">
            Proctor<span className="text-cyan-400">AI</span>
          </h1>

        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex gap-8 text-gray-300">

          <li>
            <a
              href="/"
              className="hover:text-cyan-400 transition"
            >
              Home
            </a>
          </li>

          <li>
            <a
              href="#features"
              className="hover:text-cyan-400 transition"
            >
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
            <a
              href="#about"
              className="hover:text-cyan-400 transition"
            >
              About
            </a>
          </li>

          <li>
            <a
              href="#contact"
              className="hover:text-cyan-400 transition"
            >
              Contact
            </a>
          </li>

        </ul>

        {/* Desktop Buttons */}

        <div className="hidden lg:flex gap-4">

          <Link to="/login">

            <button className="text-white hover:text-cyan-400 transition">
              Login
            </button>

          </Link>

          <Link to="/login">

            <button className="bg-cyan-500 hover:bg-cyan-400 transition px-6 py-2 rounded-xl font-semibold text-black">
              Get Started
            </button>

          </Link>

        </div>

        {/* Mobile Icon */}

        <button
          className="lg:hidden text-white text-3xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <HiX /> : <HiMenuAlt3 />}
        </button>

      </div>

      {/* Mobile Menu */}

      {isOpen && (

        <div className="lg:hidden bg-[#0b1120] border-t border-white/10 px-6 py-6">

          <ul className="space-y-5 text-gray-300">

            <li>
              <a href="/">Home</a>
            </li>

            <li>
              <a href="#features">Features</a>
            </li>

            <li>
              <a href="#how-it-works">How It Works</a>
            </li>

            <li>
              <a href="#about">About</a>
            </li>

            <li>
              <a href="#contact">Contact</a>
            </li>

          </ul>

          <div className="mt-6 flex flex-col gap-3">

            <Link to="/login">

              <button className="w-full border border-cyan-400 py-2 rounded-lg text-white">
                Login
              </button>

            </Link>

            <Link to="/login">

              <button className="w-full bg-cyan-500 py-2 rounded-lg font-semibold text-black">
                Get Started
              </button>

            </Link>

          </div>

        </div>

      )}

    </nav>
  );
};

export default Navbar;