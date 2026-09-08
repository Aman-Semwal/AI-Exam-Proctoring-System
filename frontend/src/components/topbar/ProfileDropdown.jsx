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
    <div className="w-56 bg-[#121520] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150">
      <div className="p-3.5 border-b border-white/[0.06] bg-white/[0.01]">
        <h3 className="text-xs font-semibold text-white truncate">
          Anchal Saini
        </h3>
        <p className="text-[11px] text-slate-400 truncate mt-0.5">
          anchal@gmail.com
        </p>
      </div>

      <div className="p-1 space-y-0.5">
        <button
          onClick={() => navigate("/student/profile")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition"
        >
          <FaUser className="text-slate-400 text-xs" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => navigate("/student/results")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition"
        >
          <FaChartBar className="text-slate-400 text-xs" />
          <span>Exam Results</span>
        </button>

        <button
          onClick={() => navigate("/student/settings")}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-lg transition"
        >
          <FaCog className="text-slate-400 text-xs" />
          <span>Account Settings</span>
        </button>
      </div>

      <div className="p-1 border-t border-white/[0.06]">
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          <FaSignOutAlt className="text-xs" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;