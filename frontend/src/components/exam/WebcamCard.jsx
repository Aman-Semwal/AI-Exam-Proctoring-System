const WebcamCard = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5">

      <h2 className="text-xl font-bold text-white mb-5">
        Live Camera
      </h2>

      <div className="h-64 rounded-xl bg-slate-800 flex items-center justify-center border-2 border-dashed border-cyan-400">

        <div className="text-center">

          <div className="text-6xl mb-3">
            📷
          </div>

          <p className="text-gray-400">
            Webcam Preview
          </p>

        </div>

      </div>

      <div className="mt-5 flex justify-between items-center">

        <span className="text-green-400 font-semibold">
          ● Camera Connected
        </span>

        <button className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-semibold transition">
          Test Camera
        </button>

      </div>

    </div>
  );
};

export default WebcamCard;