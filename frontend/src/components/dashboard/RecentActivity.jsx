const activities = [
  {
    title: "AI Exam Completed",
    time: "10 minutes ago",
  },
  {
    title: "Face Verification Successful",
    time: "Today",
  },
  {
    title: "Operating System Result Published",
    time: "Yesterday",
  },
  {
    title: "New Exam Scheduled",
    time: "2 days ago",
  },
];

const RecentActivity = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-white tracking-tight">
          Recent Activity
        </h2>
        <span className="text-xs text-slate-400 font-mono">Event Log</span>
      </div>

      <div className="space-y-4">
        {activities.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 pb-3.5 border-b border-white/[0.04] last:border-none last:pb-0"
          >
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0 shadow-sm shadow-blue-400/50" />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-medium text-slate-200 truncate">
                {item.title}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;