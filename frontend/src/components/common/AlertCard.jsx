const AlertCard = ({ title, message, type }) => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {title}
        </h3>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            type === "Warning"
              ? "bg-yellow-500/20 text-yellow-400"
              : type === "Danger"
              ? "bg-red-500/20 text-red-400"
              : "bg-cyan-500/20 text-cyan-400"
          }`}
        >
          {type}
        </span>
      </div>

      <p className="text-gray-400 mt-4 leading-6">
        {message}
      </p>

    </div>
  );
};

export default AlertCard;