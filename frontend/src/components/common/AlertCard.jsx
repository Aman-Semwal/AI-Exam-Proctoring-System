const AlertCard = ({ title, message, type }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case "Warning":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Danger":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          {title}
        </h3>

        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getBadgeStyle()}`}
        >
          {type}
        </span>
      </div>

      <p className="text-slate-400 text-xs mt-2.5 leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default AlertCard;