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
    <div className="flex bg-[#020617] min-h-screen">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="p-8">

          <h2 className="text-4xl font-bold text-white">
            Settings
          </h2>

          <p className="text-gray-400 mt-2">
            Manage your account preferences.
          </p>

          <div className="grid lg:grid-cols-2 gap-8 mt-10">

            {/* Account */}

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <FaUserCog className="text-cyan-400 text-2xl" />

                <h3 className="text-white text-xl font-semibold">
                  Account Settings
                </h3>

              </div>

              <input
                placeholder="Username"
                defaultValue="Anchal Saini"
                className="w-full mb-4 bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

              <input
                placeholder="Email"
                defaultValue="anchal@gmail.com"
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-cyan-400"
              />

            </div>

            {/* Notifications */}

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <FaBell className="text-yellow-400 text-2xl" />

                <h3 className="text-white text-xl font-semibold">
                  Notifications
                </h3>

              </div>

              <label className="flex justify-between items-center text-white mb-4">

                Email Notifications

                <input type="checkbox" defaultChecked />

              </label>

              <label className="flex justify-between items-center text-white">

                Push Notifications

                <input type="checkbox" defaultChecked />

              </label>

            </div>

            {/* Password */}

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <FaLock className="text-red-400 text-2xl" />

                <h3 className="text-white text-xl font-semibold">
                  Change Password
                </h3>

              </div>

              <input
                type="password"
                placeholder="Current Password"
                className="w-full mb-4 bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
              />

              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            {/* Preferences */}

            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6">

              <div className="flex items-center gap-3 mb-6">

                <FaMoon className="text-cyan-400 text-2xl" />

                <h3 className="text-white text-xl font-semibold">
                  Preferences
                </h3>

              </div>

              <label className="flex justify-between items-center text-white mb-4">

                Dark Mode

                <input type="checkbox" defaultChecked />

              </label>

              <label className="flex justify-between items-center text-white">

                Email Updates

                <input type="checkbox" defaultChecked />

              </label>

            </div>

          </div>

          {/* Email Preferences */}

          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 mt-8">

            <div className="flex items-center gap-3 mb-6">

              <FaEnvelope className="text-cyan-400 text-2xl" />

              <h3 className="text-white text-xl font-semibold">
                Email Preferences
              </h3>

            </div>

            <input
              placeholder="Recovery Email"
              defaultValue="anchal@gmail.com"
              className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-4 py-3 text-white outline-none"
            />

          </div>

          <button className="mt-10 bg-cyan-500 hover:bg-cyan-400 px-8 py-3 rounded-xl font-semibold text-black transition">

            Save Settings

          </button>

        </div>

      </div>

    </div>
  );
};

export default Settings;