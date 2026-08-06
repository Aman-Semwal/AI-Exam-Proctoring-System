import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section
      id="about"
      className="bg-[#030712] py-24"
    >
      <div className="max-w-6xl mx-auto px-6">

        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-12 text-center">

          <h2 className="text-5xl font-bold text-white">
            Ready to Secure Your Online Exams?
          </h2>

          <p className="text-gray-400 mt-6 text-lg max-w-2xl mx-auto">
            Experience AI-powered exam monitoring with face detection,
            eye tracking, voice monitoring, and detailed reports.
          </p>

          <div className="mt-10 flex justify-center gap-5 flex-wrap">

            <Link to="/login">
              <button className="bg-cyan-500 hover:bg-cyan-400 transition px-8 py-4 rounded-xl text-black font-semibold">
                Get Started
              </button>
            </Link>

            <a href="#contact">
              <button className="border border-cyan-500 hover:bg-cyan-500/20 transition px-8 py-4 rounded-xl text-white">
                Contact Us
              </button>
            </a>

          </div>

        </div>

      </div>
    </section>
  );
};

export default CTA;