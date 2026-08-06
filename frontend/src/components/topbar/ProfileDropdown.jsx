import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaCog,
  FaChartBar,
  FaSignOutAlt,
} from "react-icons/fa";

const ProfileDropdown = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <div className="w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

      <div className="p-5 border-b border-white/10">

        <h3 className="text-white font-bold">
          Anchal Saini
        </h3>

        <p className="text-gray-400 text-sm">
          Student
        </p>

      </div>

      <button
        onClick={() => navigate("/profile")}
        className="w-full flex items-center gap-3 px-5 py-4 text-gray-300 hover:bg-slate-800 transition"
      >
        <FaUser />
        My Profile
      </button>

      <button
        onClick={() => navigate("/results")}
        className="w-full flex items-center gap-3 px-5 py-4 text-gray-300 hover:bg-slate-800 transition"
      >
        <FaChartBar />
        Results
      </button>

      <button
        onClick={() => navigate("/settings")}
        className="w-full flex items-center gap-3 px-5 py-4 text-gray-300 hover:bg-slate-800 transition"
      >
        <FaCog />
        Settings
      </button>

      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-500/20 transition"
      >
        <FaSignOutAlt />
        Logout
      </button>

    </div>
  );
};

export default ProfileDropdown;