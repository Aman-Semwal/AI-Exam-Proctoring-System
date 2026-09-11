import { NavLink, useNavigate } from "react-router-dom";
import {
  FaLayerGroup,
  FaTachometerAlt,
  FaBuilding,
  FaUsers,
  FaFileAlt,
  FaVideo,
  FaChartBar,
  FaServer,
  FaCog,
  FaSignOutAlt,
  FaSun,
  FaMoon,
} from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { to: "/super-admin/dashboard", icon: FaTachometerAlt, label: "Dashboard" },
  { to: "/super-admin/organizations", icon: FaBuilding, label: "Organizations" },
  { to: "/super-admin/users", icon: FaUsers, label: "Users" },
  { to: "/super-admin/exams", icon: FaFileAlt, label: "Exams" },
  { to: "/super-admin/live-sessions", icon: FaVideo, label: "Live Sessions" },
  { to: "/super-admin/analytics", icon: FaChartBar, label: "Analytics" },
  { to: "/super-admin/system-health", icon: FaServer, label: "System Health" },
  { to: "/super-admin/settings", icon: FaCog, label: "Settings" },
];

const SuperAdminSidebar = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    // Remove real authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Go to login page
    navigate("/login");
  };

  return (
    <aside className="w-60 shrink-0 min-h-screen flex flex-col justify-between py-5 px-3 sticky top-0 h-screen sidebar-bg">
      <div>
        <div
          className="flex items-center gap-2.5 px-3 py-2 mb-6 cursor-pointer"
          onClick={() => navigate("/super-admin/dashboard")}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-violet-500"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.3)",
            }}
          >
            <FaLayerGroup size={15} />
          </div>

          <span
            className="font-bold text-sm"
            style={{ color: "var(--text-primary)" }}
          >
            Super<span className="text-violet-500">Admin</span>
          </span>
        </div>

        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: "var(--text-muted)" }}
        >
          Platform Control
        </p>

        <nav className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive ? "border border-violet-500/20" : ""
                }`
              }
              style={({ isActive }) => ({
                color: isActive
                  ? "#8b5cf6"
                  : "var(--text-secondary)",
                background: isActive
                  ? "rgba(139,92,246,0.12)"
                  : "transparent",
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="space-y-1">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition"
          style={{ color: "var(--text-muted)" }}
        >
          {isDark ? (
            <FaSun size={13} className="text-amber-400" />
          ) : (
            <FaMoon size={13} className="text-indigo-400" />
          )}

          {isDark ? "Light Mode" : "Dark Mode"}
        </button>

        {/* User */}
        <div
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-violet-500"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
          >
            SA
          </div>

          <div className="min-w-0">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              Super Admin
            </p>

            <p
              className="text-[10px] truncate"
              style={{ color: "var(--text-muted)" }}
            >
              System Root
            </p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background =
              "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <FaSignOutAlt size={13} />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;