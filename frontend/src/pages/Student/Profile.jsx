import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import { FaUserCircle } from "react-icons/fa";

const Profile = () => {
  return (
    <div className="flex bg-[#020617] min-h-screen">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="p-8">

          <h2 className="text-4xl font-bold text-white">
            My Profile
          </h2>

          <p className="text-gray-400 mt-2">
            Manage your personal information.
          </p>

          <div className="bg-slate-900 border border-white/10 rounded-3xl mt-10 p-8">

            <div className="flex flex-col items-center">

              <FaUserCircle
                className="text-cyan-400"
                size={120}
              />

              <button className="mt-4 bg-cyan-500 hover:bg-cyan-400 px-6 py-2 rounded-xl text-black font-semibold transition">
                Change Photo
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-10">

              <div>
                <label className="text-gray-300 block mb-2">
                  Full Name
                </label>

                <input
                  defaultValue="Anchal Saini"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-2">
                  Email
                </label>

                <input
                  defaultValue="anchal@gmail.com"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-2">
                  Phone
                </label>

                <input
                  defaultValue="+91 9876543210"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-2">
                  University
                </label>

                <input
                  defaultValue="MM(DU)"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-2">
                  Course
                </label>

                <input
                  defaultValue="B.Tech CSE"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-2">
                  Semester
                </label>

                <input
                  defaultValue="7th Semester"
                  className="w-full bg-[#0f172a] border border-gray-700 rounded-xl px-5 py-3 text-white focus:border-cyan-400 outline-none"
                />
              </div>

            </div>

            <button className="mt-10 bg-cyan-500 hover:bg-cyan-400 px-8 py-3 rounded-xl text-black font-semibold transition">
              Save Changes
            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;