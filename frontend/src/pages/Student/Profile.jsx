import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { FaUserCircle, FaCamera } from "react-icons/fa";

const Profile = () => {
  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              My Profile
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage your personal information and student account credentials.
            </p>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 sm:p-8 shadow-sm">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/[0.06]">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-2xl font-bold text-blue-400 shadow-md">
                  AS
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow">
                  <FaCamera size={12} />
                </button>
              </div>

              <div className="text-center sm:text-left">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Anchal Saini
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Student ID: MMU-2026-CSE-042
                </p>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Biometric Face Verified
                </span>
              </div>
            </div>

            {/* Input Form Fields */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <input
                  defaultValue="Anchal Saini"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Email
                </label>
                <input
                  defaultValue="anchal@gmail.com"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Phone
                </label>
                <input
                  defaultValue="+91 9876543210"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  University
                </label>
                <input
                  defaultValue="MM(DU)"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Course
                </label>
                <input
                  defaultValue="B.Tech CSE"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Semester
                </label>
                <input
                  defaultValue="7th Semester"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.06] flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg text-white text-xs font-semibold transition active:scale-[0.98] shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;