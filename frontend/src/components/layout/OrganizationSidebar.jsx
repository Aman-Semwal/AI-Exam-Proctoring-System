import { NavLink, useNavigate } from "react-router-dom";
import {
  FaShieldAlt, FaTachometerAlt, FaUsers, FaUserTie,
  FaUserShield, FaFileAlt, FaCalendarAlt, FaSignOutAlt,
  FaSun, FaMoon,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { to: "/organization/dashboard",     icon: FaTachometerAlt, label: "Dashboard" },
  { to: "/organization/students",      icon: FaUsers,         label: "Students" },
  { to: "/organization/examiners",     icon: FaUserTie,       label: "Examiners" },
  { to: "/organization/proctors",      icon: FaUserShield,    label: "Proctors" },
  { to: "/organization/active-exams",  icon: FaFileAlt,       label: "Active Exams" },
  { to: "/organization/upcoming-exams",icon: FaCalendarAlt,   label: "Upcoming Exams" },
];

const OrganizationSidebar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  return (
    <aside className="w-60 shrink-0 min-h-screen flex flex-col justify-between py-5 px-3 sticky top-0 h-screen sidebar-bg">
      <div>
        <div className="flex items-center gap-2.5 px-3 py-2 mb-6 cursor-pointer"
          onClick={() => navigate("/organization/dashboard")}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-blue-500"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" }}>
            <FaShieldAlt size={15} />
          </div>
          <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
            Org<span className="text-blue-500">Portal</span>
          </span>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: "var(--text-muted)" }}>
          Management
        </p>

        <nav className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive ? "bg-blue-600/15 border border-blue-500/20" : ""
                }`}
              style={({ isActive }) => ({
                color: isActive ? "#3b82f6" : "var(--text-secondary)",
              })}>
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-1">
        <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition"
          style={{ color: "var(--text-muted)" }}>
          {isDark ? <FaSun size={13} className="text-amber-400" /> : <FaMoon size={13} className="text-indigo-400" />}
          {isDark ? "Light Mode" : "Dark Mode"}
        </button>
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-500 font-bold text-xs">
            AS
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>Anchal Saini</p>
            <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>Org Admin</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}>
          <FaSignOutAlt size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default OrganizationSidebar;