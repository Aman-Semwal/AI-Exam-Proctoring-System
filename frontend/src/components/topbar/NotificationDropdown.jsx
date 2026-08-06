const notifications = [
  {
    title: "AI Alert",
    message: "Face verification completed successfully.",
    time: "2 min ago",
  },
  {
    title: "Exam Reminder",
    message: "AI Exam starts tomorrow at 10:00 AM.",
    time: "1 hour ago",
  },
  {
    title: "Result Published",
    message: "Operating System result is available.",
    time: "Yesterday",
  },
];

const NotificationDropdown = () => {
  return (
    <div className="w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="text-white font-bold text-lg">
          Notifications
        </h2>
      </div>

      <div className="max-h-80 overflow-y-auto">

        {notifications.map((item, index) => (
          <div
            key={index}
            className="px-5 py-4 border-b border-white/5 hover:bg-slate-800 transition cursor-pointer"
          >
            <h3 className="text-white font-semibold">
              {item.title}
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              {item.message}
            </p>

            <span className="text-cyan-400 text-xs">
              {item.time}
            </span>
          </div>
        ))}

      </div>

      <div className="p-4 text-center border-t border-white/10">
        <button className="text-cyan-400 hover:text-cyan-300">
          View All Notifications
        </button>
      </div>

    </div>
  );
};

export default NotificationDropdown;