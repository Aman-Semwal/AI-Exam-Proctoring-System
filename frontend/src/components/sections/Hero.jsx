import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowRight,
  FaPlayCircle,
  FaTimes,
  FaCamera,
  FaEye,
  FaShieldAlt,
} from "react-icons/fa";

import dashboardPreview from "../../assets/dashboard-preview.png";

const Hero = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <section className="min-h-screen bg-[#030712] pt-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Side */}
          <div>

            <span className="inline-block px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              🚀 AI Powered Online Examination
            </span>

            <h1 className="text-5xl lg:text-7xl font-extrabold text-white mt-8 leading-tight">
              Secure Your
              <span className="text-cyan-400"> Online Exams </span>
              with AI
            </h1>

            <p className="text-gray-400 mt-8 text-lg leading-8">
              Monitor online examinations using Face Detection,
              Eye Tracking, Tab Switching Detection,
              Voice Monitoring and AI Generated Reports.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-5 mt-10">

              {/* Get Started */}
              <button
                onClick={() => navigate("/login")}
                className="bg-cyan-500 hover:bg-cyan-400 transition px-7 py-4 rounded-xl text-black font-bold flex items-center gap-2"
              >
                Get Started
                <FaArrowRight />
              </button>

              {/* Watch Demo */}
              <button
                onClick={() => setShowDemo(true)}
                className="border border-cyan-500 px-7 py-4 rounded-xl text-white hover:bg-cyan-500/20 transition flex items-center gap-2"
              >
                <FaPlayCircle />
                Watch Demo
              </button>

            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-5 mt-14">

              <div>
                <h2 className="text-3xl font-bold text-cyan-400">
                  99.9%
                </h2>
                <p className="text-gray-400">
                  Accuracy
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-cyan-400">
                  10K+
                </h2>
                <p className="text-gray-400">
                  Students
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-cyan-400">
                  24/7
                </h2>
                <p className="text-gray-400">
                  Monitoring
                </p>
              </div>

            </div>

          </div>

          {/* Right Side */}
          <div className="relative">

            <div className="rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl">

              <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-900/20 p-6">

                {/* Dashboard Image */}
                <div className="rounded-xl overflow-hidden h-72 border border-white/10">
                  <img
                    src={dashboardPreview}
                    alt="ProctorAI Dashboard Preview"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mt-6">

                  <div className="bg-slate-800 rounded-xl p-4 text-center">
                    <FaCamera className="mx-auto text-cyan-400 text-2xl" />
                    <p className="text-sm mt-2">
                      Camera
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4 text-center">
                    <FaEye className="mx-auto text-cyan-400 text-2xl" />
                    <p className="text-sm mt-2">
                      Eye Track
                    </p>
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4 text-center">
                    <FaShieldAlt className="mx-auto text-cyan-400 text-2xl" />
                    <p className="text-sm mt-2">
                      Integrity
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================= DEMO POPUP ================= */}

      {showDemo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center px-6">

          <div className="relative w-full max-w-4xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl">

            {/* Close Button */}
            <button
              onClick={() => setShowDemo(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl"
            >
              <FaTimes />
            </button>

            {/* Heading */}
            <div className="mb-6">
              <p className="text-cyan-400 font-semibold">
                AI Exam Proctoring
              </p>

              <h2 className="text-3xl font-bold text-white mt-2">
                How ProctorAI Works
              </h2>

              <p className="text-gray-400 mt-2">
                AI continuously monitors the examination environment
                to maintain exam integrity.
              </p>
            </div>

            {/* Demo Preview */}
            <div className="bg-[#020617] rounded-2xl border border-white/10 p-6">

              <div className="grid md:grid-cols-3 gap-5">

                {/* Camera */}
                <div className="bg-slate-800 rounded-xl p-6 text-center">
                  <FaCamera className="mx-auto text-cyan-400 text-4xl" />

                  <h3 className="text-white font-semibold mt-4">
                    Face Detection
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    Detects and monitors the candidate's face.
                  </p>

                  <span className="inline-block mt-4 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Active
                  </span>
                </div>

                {/* Eye Tracking */}
                <div className="bg-slate-800 rounded-xl p-6 text-center">
                  <FaEye className="mx-auto text-cyan-400 text-4xl" />

                  <h3 className="text-white font-semibold mt-4">
                    Eye Tracking
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    Monitors suspicious eye movements.
                  </p>

                  <span className="inline-block mt-4 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Active
                  </span>
                </div>

                {/* Security */}
                <div className="bg-slate-800 rounded-xl p-6 text-center">
                  <FaShieldAlt className="mx-auto text-cyan-400 text-4xl" />

                  <h3 className="text-white font-semibold mt-4">
                    Exam Security
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    Detects tab switching and suspicious activity.
                  </p>

                  <span className="inline-block mt-4 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Protected
                  </span>
                </div>

              </div>

              {/* Start Exam */}
              <button
                onClick={() => {
                  setShowDemo(false);
                  navigate("/login");
                }}
                className="mt-7 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                Start Your Exam
                <FaArrowRight />
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
};

export default Hero;