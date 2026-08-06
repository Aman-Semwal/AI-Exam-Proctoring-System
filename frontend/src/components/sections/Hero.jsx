import { FaArrowRight, FaPlayCircle } from "react-icons/fa";

const Hero = () => {
  return (
    <section className="min-h-screen bg-[#030712] pt-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">

        {/* Left */}
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

          <div className="flex flex-wrap gap-5 mt-10">

            <button className="bg-cyan-500 hover:bg-cyan-400 transition px-7 py-4 rounded-xl text-black font-bold flex items-center gap-2">
              Get Started
              <FaArrowRight />
            </button>

            <button className="border border-cyan-500 px-7 py-4 rounded-xl text-white hover:bg-cyan-500/20 flex items-center gap-2">
              <FaPlayCircle />
              Watch Demo
            </button>

          </div>

          <div className="grid grid-cols-3 gap-5 mt-14">

            <div>
              <h2 className="text-3xl font-bold text-cyan-400">99.9%</h2>
              <p className="text-gray-400">Accuracy</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-cyan-400">10K+</h2>
              <p className="text-gray-400">Students</p>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-cyan-400">24/7</h2>
              <p className="text-gray-400">Monitoring</p>
            </div>

          </div>

        </div>

        {/* Right */}

        <div className="relative">

          <div className="rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 shadow-2xl">

            <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-900/20 p-6">

              <div className="bg-slate-800 rounded-xl h-72 flex items-center justify-center text-cyan-300 text-2xl font-bold">
                Dashboard Preview
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">

                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  📹
                  <p className="text-sm mt-2">Camera</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  👁️
                  <p className="text-sm mt-2">Eye Track</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 text-center">
                  🛡️
                  <p className="text-sm mt-2">Integrity</p>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default Hero;