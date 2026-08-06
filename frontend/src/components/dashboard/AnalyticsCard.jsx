import {
  FaBook,
  FaGraduationCap,
  FaClock,
  FaStar,
} from "react-icons/fa";

const cards = [
  {
    icon: <FaBook />,
    title: "Subjects",
    value: "6",
    color: "text-cyan-400",
  },
  {
    icon: <FaGraduationCap />,
    title: "Passed",
    value: "6",
    color: "text-green-400",
  },
  {
    icon: <FaClock />,
    title: "Study Hours",
    value: "124",
    color: "text-yellow-400",
  },
  {
    icon: <FaStar />,
    title: "Rank",
    value: "#12",
    color: "text-purple-400",
  },
];

const AnalyticsCard = () => {
  return (
    <div className="grid md:grid-cols-2 gap-6">

      {cards.map((card, index) => (

        <div
          key={index}
          className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-cyan-400 transition"
        >

          <div className={`text-3xl ${card.color}`}>
            {card.icon}
          </div>

          <h3 className="text-gray-400 mt-4">
            {card.title}
          </h3>

          <p className={`text-3xl font-bold mt-2 ${card.color}`}>
            {card.value}
          </p>

        </div>

      ))}

    </div>
  );
};

export default AnalyticsCard;