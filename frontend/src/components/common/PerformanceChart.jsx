const PerformanceChart = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-2xl font-bold text-white mb-6">
        Performance
      </h2>

      <div className="flex items-end justify-between h-64">

        <div className="w-12 bg-cyan-500 rounded-t-xl h-40"></div>

        <div className="w-12 bg-green-500 rounded-t-xl h-52"></div>

        <div className="w-12 bg-yellow-500 rounded-t-xl h-36"></div>

        <div className="w-12 bg-purple-500 rounded-t-xl h-56"></div>

        <div className="w-12 bg-pink-500 rounded-t-xl h-44"></div>

      </div>

    </div>
  );
};

export default PerformanceChart;