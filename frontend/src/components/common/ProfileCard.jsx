const ProfileCard = () => {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
      <div className="flex flex-col items-center">

        <div className="w-24 h-24 rounded-full bg-cyan-500 flex items-center justify-center text-4xl font-bold text-black">
          A
        </div>

        <h2 className="text-2xl font-bold text-white mt-5">
          Anchal Saini
        </h2>

        <p className="text-gray-400">
          B.Tech CSE
        </p>

      </div>

      <div className="mt-8 space-y-4">

        <div className="flex justify-between">
          <span className="text-gray-400">Semester</span>
          <span className="text-white">7th</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Attendance</span>
          <span className="text-green-400">95%</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Department</span>
          <span className="text-white">CSE</span>
        </div>

      </div>
    </div>
  );
};

export default ProfileCard;