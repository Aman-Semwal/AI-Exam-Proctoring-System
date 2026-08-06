import {
  FaSignInAlt,
  FaUserCheck,
  FaLaptop,
  FaRobot,
  FaFileAlt,
} from "react-icons/fa";

const steps = [
  {
    icon: <FaSignInAlt size={28} />,
    title: "Login",
    desc: "Student securely logs into the examination portal.",
  },
  {
    icon: <FaUserCheck size={28} />,
    title: "Face Verification",
    desc: "AI verifies the student's identity before the exam starts.",
  },
  {
    icon: <FaLaptop size={28} />,
    title: "Start Exam",
    desc: "Students begin the online examination in a secure environment.",
  },
  {
    icon: <FaRobot size={28} />,
    title: "AI Monitoring",
    desc: "AI continuously monitors face, eyes, tab switching and activity.",
  },
  {
    icon: <FaFileAlt size={28} />,
    title: "Generate Report",
    desc: "A complete integrity report is generated after the exam.",
  },
];

const HowItWorks = () => {
  return (
    <section
      id="how-it-works"
      className="bg-[#020617] py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-20">
          <p className="text-cyan-400 uppercase tracking-widest font-semibold">
            Process
          </p>

          <h2 className="text-5xl font-bold text-white mt-4">
            How It Works
          </h2>

          <p className="text-gray-400 mt-5 max-w-2xl mx-auto">
            Our AI-powered system ensures a secure and fair examination
            experience from login to report generation.
          </p>
        </div>

        {/* Steps */}
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-8">

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-slate-900 border border-white/10 rounded-3xl p-8 text-center hover:border-cyan-500 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-6">
                {step.icon}
              </div>

              <div className="absolute top-4 right-4 text-cyan-500 font-bold text-xl">
                {index + 1}
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                {step.title}
              </h3>

              <p className="text-gray-400 leading-7">
                {step.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default HowItWorks;