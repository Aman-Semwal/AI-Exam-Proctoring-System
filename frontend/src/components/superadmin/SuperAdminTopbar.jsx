import { FaBell, FaSearch, FaSun, FaMoon } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext";

const SuperAdminTopbar = ({ title = "Dashboard", breadcrumb = "Super Admin" }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 sticky top-0 z-20"
      style={{
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div>
        <p className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{breadcrumb}</p>
        <h1 className="text-sm font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <FaSearch size={11} />
          <span>Search</span>
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            ⌘K
          </span>
        </div>

        <button onClick={toggleTheme} aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: isDark ? "#fbbf24" : "#6366f1" }}>
          {isDark ? <FaSun size={13} /> : <FaMoon size={13} />}
        </button>

        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center transition"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
          <FaBell size={13} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
        </button>

        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-violet-500"
          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
          SA
        </div>
      </div>
    </header>
  );
};

export default SuperAdminTopbar;