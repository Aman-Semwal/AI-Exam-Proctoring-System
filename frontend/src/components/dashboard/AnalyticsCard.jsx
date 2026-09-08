import {
  FaBook,
  FaGraduationCap,
  FaClock,
  FaStar,
} from "react-icons/fa";

const cards = [
  {
    icon: <FaBook size={16} />,
    title: "Enrolled Subjects",
    value: "6",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: <FaGraduationCap size={16} />,
    title: "Exams Passed",
    value: "6",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: <FaClock size={16} />,
    title: "Study Hours",
    value: "124 hrs",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: <FaStar size={16} />,
    title: "Class Rank",
    value: "#12",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
];

const AnalyticsCard = () => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-slate-400">
              {card.title}
            </h3>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
          </div>

          <p className="text-xl sm:text-2xl font-bold text-white mt-3 tracking-tight">
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCard;