import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaBell,
  FaSearch,
  FaMoon,
  FaSun,
  FaUserCircle,
} from "react-icons/fa";

import NotificationDropdown from "../topbar/NotificationDropdown";
import ProfileDropdown from "../topbar/ProfileDropdown";

const Topbar = () => {
  const navigate = useNavigate();

  // Theme
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") !== "light"
  );

  // Dropdowns
  const [showNotification, setShowNotification] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Search
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-40 h-20 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-8">

      {/* Left */}

      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-white">
          Welcome Back 👋
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Student Dashboard
        </p>
      </div>

      {/* Right */}

      <div className="flex items-center gap-3 md:gap-5 relative">

        {/* Search */}

        <div className="hidden lg:flex items-center bg-slate-800 rounded-xl px-4 py-3 border border-white/10">

          <FaSearch className="text-gray-400" />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none text-white ml-3 w-56"
          />

        </div>

        {/* Dark Mode */}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
        >
          {darkMode ? (
            <FaSun className="text-yellow-400 text-lg" />
          ) : (
            <FaMoon className="text-white text-lg" />
          )}
        </button>

        {/* Notification */}

        <button
          onClick={() => {
            setShowNotification(!showNotification);
            setShowProfile(false);
          }}
          className="relative w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
        >
          <FaBell className="text-white" />

          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {showNotification && (
          <div className="absolute right-20 top-16">
            <NotificationDropdown />
          </div>
        )}

        {/* Profile */}

        <button
          onClick={() => {
            setShowProfile(!showProfile);
            setShowNotification(false);
          }}
          className="flex items-center gap-3"
        >
          <FaUserCircle className="text-cyan-400 text-4xl" />

          <div className="hidden lg:block text-left">
            <h3 className="text-white font-semibold">
              Anchal Saini
            </h3>

            <p className="text-gray-400 text-sm">
              Student
            </p>
          </div>
        </button>

        {showProfile && (
          <div className="absolute right-0 top-16">
            <ProfileDropdown />
          </div>
        )}

      </div>

    </header>
  );
};

export default Topbar;