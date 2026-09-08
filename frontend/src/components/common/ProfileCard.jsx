const ProfileCard = () => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4 pb-6 border-b border-white/[0.06]">
        <div className="w-14 h-14 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-lg font-bold text-blue-400">
          AS
        </div>

        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Anchal Saini
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            B.Tech Computer Science
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3 text-xs">
        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Semester</span>
          <span className="text-slate-200 font-medium">7th Semester</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Attendance</span>
          <span className="text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">95%</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Department</span>
          <span className="text-slate-200 font-medium">Computer Science & Engg</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;