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
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

      <h2 className="text-2xl text-white font-bold mb-6">
        Recent Activity
      </h2>

      <div className="space-y-5">

        {activities.map((item, index) => (

          <div
            key={index}
            className="border-b border-white/10 pb-4 last:border-none"
          >

            <h3 className="text-white font-semibold">
              {item.title}
            </h3>

            <p className="text-gray-400 text-sm mt-1">
              {item.time}
            </p>

          </div>

        ))}

      </div>

    </div>
  );
};

export default RecentActivity;