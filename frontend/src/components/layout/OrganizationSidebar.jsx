import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUsers, FaUserTie, FaUserShield, FaClipboardCheck, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";

export default function OrganizationSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const navItems = [
    { title: "Dashboard", path: "/organization/dashboard", icon: <FaUsers /> },
    { title: "Manage Students", path: "/organization/students", icon: <FaUsers /> },
    { title: "Manage Examiners", path: "/organization/examiners", icon: <FaUserTie /> },
    { title: "Manage Proctors", path: "/organization/proctors", icon: <FaUserShield /> },
    { title: "Active Exams", path: "/organization/active-exams", icon: <FaClipboardCheck /> },
    { title: "Upcoming Exams", path: "/organization/upcoming-exams", icon: <FaCalendarAlt /> },
  ];

  return (
    <aside className="w-72 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col justify-between p-6">
      <div>
        {/* Logo / Header */}
        <div className="mb-8 cursor-pointer" onClick={() => navigate("/organization/dashboard")}>
          <h1 className="text-2xl font-bold text-white">
            Org<span className="text-cyan-400">Admin</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">Organization Control Center</p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${
                location.pathname === item.path
                  ? "bg-cyan-500 text-slate-950 font-semibold shadow-md"
                  : "text-gray-300 hover:bg-slate-800 hover:text-cyan-400"
              }`}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </div>

      {/* Logout */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white py-2.5 rounded-xl transition text-sm font-medium border border-rose-500/20"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </aside>
  );
}