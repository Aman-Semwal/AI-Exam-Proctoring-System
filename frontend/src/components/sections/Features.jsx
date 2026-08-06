import {
  FaUserCheck,
  FaEye,
  FaMobileAlt,
  FaExchangeAlt,
  FaMicrophone,
  FaChartBar,
} from "react-icons/fa";

const features = [
  {
    icon: <FaUserCheck size={35} />,
    title: "Face Detection",
    desc: "Detects whether the student's face is visible during the exam.",
  },
  {
    icon: <FaEye size={35} />,
    title: "Eye Tracking",
    desc: "Monitors eye movement to identify suspicious behavior.",
  },
  {
    icon: <FaMobileAlt size={35} />,
    title: "Phone Detection",
    desc: "Detects mobile phone usage in real-time.",
  },
  {
    icon: <FaExchangeAlt size={35} />,
    title: "Tab Switching",
    desc: "Instantly detects when users switch browser tabs.",
  },
  {
    icon: <FaMicrophone size={35} />,
    title: "Voice Monitoring",
    desc: "Identifies background conversations during exams.",
  },
  {
    icon: <FaChartBar size={35} />,
    title: "AI Reports",
    desc: "Generates detailed AI-based integrity reports.",
  },
];

const Features = () => {
  return (
    <section
      id="features"
      className="bg-[#030712] py-24"
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-cyan-400 font-semibold uppercase tracking-widest">
            Features
          </p>

          <h2 className="text-5xl font-bold text-white mt-4">
            Why Choose Our Platform?
          </h2>

          <p className="text-gray-400 mt-6 max-w-2xl mx-auto">
            AI-powered monitoring tools designed to ensure secure,
            transparent and fair online examinations.
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {features.map((item, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 hover:border-cyan-500 hover:-translate-y-2 transition-all duration-300"
            >
              <div className="text-cyan-400 mb-6">
                {item.icon}
              </div>

              <h3 className="text-2xl font-semibold text-white mb-4">
                {item.title}
              </h3>

              <p className="text-gray-400 leading-7">
                {item.desc}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
};

export default Features;