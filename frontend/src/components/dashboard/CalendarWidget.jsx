const CalendarWidget = () => {
  const days = [
    "S","M","T","W","T","F","S",
    1,2,3,4,5,6,7,
    8,9,10,11,12,13,14,
    15,16,17,18,19,20,21,
    22,23,24,25,26,27,28,
    29,30,31
  ];

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

      <h2 className="text-white text-2xl font-bold mb-6">
        August 2026
      </h2>

      <div className="grid grid-cols-7 gap-3 text-center">

        {days.map((day, index) => (

          <div
            key={index}
            className={`p-2 rounded-lg
            ${
              day === 12
                ? "bg-cyan-500 text-black font-bold"
                : typeof day === "string"
                ? "text-cyan-400 font-semibold"
                : "text-gray-300 hover:bg-slate-800"
            }`}
          >
            {day}
          </div>

        ))}

      </div>

    </div>
  );
};

export default CalendarWidget;