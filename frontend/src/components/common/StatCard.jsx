const StatCard = ({ title, value, color }) => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 hover:border-cyan-400 hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-gray-400 text-sm">{title}</h3>

      <p className={`text-4xl font-bold mt-3 ${color}`}>
        {value}
      </p>
    </div>
  );
};

export default StatCard;