import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  FaMoon,
  FaBell,
  FaLock,
  FaEnvelope,
  FaUserCog,
} from "react-icons/fa";

const Settings = () => {
  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Settings
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage your account preferences and security configurations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Account Settings */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                <FaUserCog className="text-blue-400 text-sm" />
                <h3 className="text-sm font-semibold text-white">
                  Account Settings
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Username</label>
                  <input
                    placeholder="Username"
                    defaultValue="Anchal Saini"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    placeholder="Email"
                    defaultValue="anchal@gmail.com"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                <FaBell className="text-amber-400 text-sm" />
                <h3 className="text-sm font-semibold text-white">
                  Notifications
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                  <span>Email Notifications</span>
                  <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                </label>

                <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                  <span>Push Notifications</span>
                  <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                </label>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                <FaLock className="text-rose-400 text-sm" />
                <h3 className="text-sm font-semibold text-white">
                  Change Password
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Current Password"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="New Password"
                    className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                <FaMoon className="text-blue-400 text-sm" />
                <h3 className="text-sm font-semibold text-white">
                  Preferences
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                  <span>Dark Mode</span>
                  <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                </label>

                <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                  <span>Email Updates</span>
                  <input type="checkbox" defaultChecked className="accent-blue-600 rounded" />
                </label>
              </div>
            </div>
          </div>

          {/* Email Preferences */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm mt-5">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
              <FaEnvelope className="text-blue-400 text-sm" />
              <h3 className="text-sm font-semibold text-white">
                Recovery Email
              </h3>
            </div>

            <div className="text-xs">
              <label className="block text-slate-400 mb-1">Backup Address</label>
              <input
                placeholder="Recovery Email"
                defaultValue="anchal@gmail.com"
                className="w-full sm:w-96 bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-lg text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm">
              Save Settings
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;