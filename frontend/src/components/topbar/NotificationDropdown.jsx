const notifications = [
  {
    title: "AI Verification Check",
    message: "Face biometric check completed for active session.",
    time: "2m ago",
    badge: "Verified",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Assessment Schedule",
    message: "Data Structures & Algorithms starts tomorrow at 10:00 AM.",
    time: "1h ago",
    badge: "Exam",
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    title: "Report Published",
    message: "Operating Systems examination results are now live.",
    time: "Yesterday",
    badge: "Result",
    badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
];

const NotificationDropdown = () => {
  return (
    <div className="w-80 bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-xs font-semibold text-white tracking-tight">
          Notifications
        </h2>
        <span className="text-[10px] text-slate-400 font-medium">3 Unread</span>
      </div>

      <div className="divide-y divide-white/[0.04] max-h-72 overflow-y-auto">
        {notifications.map((item, index) => (
          <div
            key={index}
            className="p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-slate-200">
                {item.title}
              </h3>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-1.5">
              {item.message}
            </p>

            <span className="text-[10px] text-slate-400 font-mono">
              {item.time}
            </span>
          </div>
        ))}
      </div>

      <div className="p-2.5 text-center border-t border-white/[0.06] bg-white/[0.01]">
        <button className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition">
          Mark all as read
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;