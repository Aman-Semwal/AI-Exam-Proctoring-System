const NotificationCard = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">

      <h2 className="text-2xl font-bold text-white mb-6">
        Notifications
      </h2>

      <div className="space-y-4">

        <div className="bg-slate-800 rounded-xl p-4">
          🔔 AI Exam starts tomorrow.
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          📢 New Result Published.
        </div>

        <div className="bg-slate-800 rounded-xl p-4">
          ✅ Profile Updated Successfully.
        </div>

      </div>

    </div>
  );
};

export default NotificationCard;