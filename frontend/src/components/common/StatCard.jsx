const StatCard = ({ title, value, color = "text-blue-400" }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm">
      <h3 className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</h3>
      <p className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight ${color}`}>
        {value}
      </p>
    </div>
  );
};

export default StatCard;