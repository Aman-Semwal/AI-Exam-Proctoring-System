const AIStatus = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-xl font-bold text-white mb-5">
        🤖 AI Monitoring
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">
          <span className="text-gray-400">Face Detection</span>
          <span className="text-green-400">🟢 Active</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Eye Tracking</span>
          <span className="text-green-400">🟢 Active</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Microphone</span>
          <span className="text-green-400">🟢 Active</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Tab Switch</span>
          <span className="text-green-400">0</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Warnings</span>
          <span className="text-yellow-400">0</span>
        </div>

      </div>

    </div>
  );
};

export default AIStatus;