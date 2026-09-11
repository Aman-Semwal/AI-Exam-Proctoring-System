import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaArrowLeft,
  FaMicrochip,
  FaLock,
  FaCode,
  FaFileAlt,
  FaCheckCircle,
} from "react-icons/fa";

const Docs = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", label: "1. Executive Overview" },
    { id: "architecture", label: "2. Tech Stack & Architecture" },
    { id: "modules", label: "3. AI Proctoring Modules" },
    { id: "api", label: "4. API & Integration Guide" },
    { id: "security", label: "5. Security & Integrity Index" },
  ];

  return (
    <div className="min-h-screen bg-[#050508] text-slate-300 font-sans">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 bg-[#090b12]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
          >
            <FaArrowLeft size={12} />
            <span>Back to Home</span>
          </button>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
            <FaShieldAlt className="text-blue-500" /> ProctorAI Documentation
          </span>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-full transition shadow-lg shadow-blue-500/20"
        >
          Launch Engine
        </button>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-10">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 bg-[#090b12] border border-white/[0.08] rounded-2xl p-4">
            <h3 className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">
              Documentation
            </h3>
            <nav className="space-y-1">
              {sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveSection(sec.id)}
                  className={`block px-3 py-2 rounded-xl text-xs font-medium transition ${
                    activeSection === sec.id
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  {sec.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-12">
          {/* 1. Overview */}
          <section id="overview" className="scroll-mt-28">
            <span className="text-xs font-mono text-blue-400 font-semibold tracking-widest uppercase">
              Section 01
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 mb-4">
              Executive Overview
            </h2>
            <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong>ProctorAI</strong> is an autonomous, AI-driven online examination proctoring platform designed to ensure academic integrity in remote environments.
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-slate-400">
                <li>Real-time multi-facial detection and continuous biometric verification.</li>
                <li>3D vector gaze movement detection for anti-cheat enforcement.</li>
                <li>Automated post-exam integrity indexing and evidence log PDF generation.</li>
              </ul>
            </div>
          </section>

          {/* 2. Architecture */}
          <section id="architecture" className="scroll-mt-28">
            <span className="text-xs font-mono text-blue-400 font-semibold tracking-widest uppercase">
              Section 02
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 mb-4">
              Tech Stack & Architecture
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-2">
                  <FaCode /> Frontend Stack
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  React.js, Tailwind CSS, WebRTC API for webcam/microphone streaming, HTML5 Canvas for real-time mesh overlays.
                </p>
              </div>

              <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm mb-2">
                  <FaMicrochip /> AI & Computer Vision
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  OpenCV, TensorFlow / MediaPipe Face Mesh for 468 3D facial landmarks, Head Pose Estimation, and Gaze tracking.
                </p>
              </div>
            </div>
          </section>

          {/* 3. AI Modules */}
          <section id="modules" className="scroll-mt-28">
            <span className="text-xs font-mono text-blue-400 font-semibold tracking-widest uppercase">
              Section 03
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 mb-4">
              AI Proctoring Modules
            </h2>
            <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <div className="border-b border-white/[0.06] pb-4">
                <h4 className="text-sm font-semibold text-white">1. Face Verification & Multi-Face Detection</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Triggers an anomaly flag if the registered candidate leaves the video frame or if an additional person enters.
                </p>
              </div>
              <div className="border-b border-white/[0.06] pb-4">
                <h4 className="text-sm font-semibold text-white">2. Neural Gaze Tracking</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Calculates horizontal and vertical iris displacement vectors to detect sustained off-screen looking.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">3. Browser Lockdown & Tab Guard</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Monitors Page Visibility API, prevents clipboard operations (copy/paste), and restricts full-screen exit.
                </p>
              </div>
            </div>
          </section>

          {/* 4. API Guide */}
          <section id="api" className="scroll-mt-28">
            <span className="text-xs font-mono text-blue-400 font-semibold tracking-widest uppercase">
              Section 04
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 mb-4">
              API & Event Hook Spec
            </h2>
            <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-5 font-mono text-xs overflow-x-auto">
              <div className="text-slate-400">// Example WebSocket Anomaly Event Payload</div>
              <pre className="text-blue-300 mt-2">
{`{
  "event": "ANOMALY_DETECTED",
  "sessionId": "exam_session_9823",
  "candidateId": "usr_4021",
  "timestamp": "2026-03-30T10:14:22Z",
  "type": "GAZE_DEV",
  "confidenceScore": 0.94,
  "telemetry": {
    "pitch": 12.4,
    "yaw": -34.8,
    "gazeVector": [0.02, -0.15]
  }
}`}
              </pre>
            </div>
          </section>

          {/* 5. Security */}
          <section id="security" className="scroll-mt-28">
            <span className="text-xs font-mono text-blue-400 font-semibold tracking-widest uppercase">
              Section 05
            </span>
            <h2 className="text-2xl font-bold text-white mt-1 mb-4">
              Security & Integrity Index
            </h2>
            <div className="bg-[#090b12] border border-white/[0.08] rounded-2xl p-6">
              <p className="text-xs text-slate-400 leading-relaxed">
                The overall Integrity Index score ($I_s$) is dynamically computed using a weighted algorithm across all recorded anomaly vectors:
              </p>
              <div className="mt-4 p-4 rounded-xl bg-[#05060a] border border-white/[0.06] text-xs font-mono text-emerald-400 flex items-center gap-2">
                <FaCheckCircle />
                <span>Integrity Index Formula: Score = 100 - Σ (Severity Weight × Anomaly Duration)</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Docs;