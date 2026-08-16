import { useLocation, useNavigate } from "react-router-dom";

import {
  FaTachometerAlt,
  FaBuilding,
  FaUsers,
  FaClipboardList,
  FaVideo,
  FaChartBar,
  FaServer,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const SuperAdminSidebar = () => {

  const navigate = useNavigate();
  const location = useLocation();

  const menus = [
    {
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      path: "/super-admin/dashboard",
    },
    {
      title: "Organizations",
      icon: <FaBuilding />,
      path: "/super-admin/organizations",
    },
    {
      title: "Users",
      icon: <FaUsers />,
      path: "/super-admin/users",
    },
    {
      title: "Exams",
      icon: <FaClipboardList />,
      path: "/super-admin/exams",
    },
    {
      title: "Live Sessions",
      icon: <FaVideo />,
      path: "/super-admin/live-sessions",
    },
    {
      title: "Analytics",
      icon: <FaChartBar />,
      path: "/super-admin/analytics",
    },
    {
      title: "System Health",
      icon: <FaServer />,
      path: "/super-admin/system-health",
    },
  ];

  const handleLogout = () => {

    localStorage.removeItem("isLoggedIn");

    navigate("/login");
  };

  return (
    <aside className="hidden lg:flex w-72 min-h-screen bg-slate-900 border-r border-white/10 flex-col justify-between sticky top-0">

      <div>

        {/* Logo */}
        <div className="p-7 border-b border-white/10">

          <button
            onClick={() => navigate("/super-admin/dashboard")}
            className="text-left"
          >

            <h1 className="text-3xl font-bold text-white">
              Proctor
              <span className="text-cyan-400">
                AI
              </span>
            </h1>

            <p className="text-gray-400 text-sm mt-2">
              Platform Administration
            </p>

          </button>

        </div>

        {/* Menu */}
        <nav className="p-5 space-y-2">

          <p className="text-xs uppercase tracking-widest text-gray-500 px-3 mb-4">
            Management
          </p>

          {menus.map((item) => {

            const active =
              location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition ${
                  active
                    ? "bg-cyan-500 text-black"
                    : "text-gray-300 hover:bg-slate-800 hover:text-cyan-400"
                }`}
              >

                <span className="text-lg">
                  {item.icon}
                </span>

                <span className="font-medium">
                  {item.title}
                </span>

              </button>
            );

          })}

          <p className="text-xs uppercase tracking-widest text-gray-500 px-3 pt-6 mb-3">
            System
          </p>

          <button
            onClick={() => navigate("/settings")}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-300 hover:bg-slate-800 hover:text-cyan-400 transition"
          >

            <FaCog />

            <span className="font-medium">
              Settings
            </span>

          </button>

        </nav>

      </div>

      {/* Admin */}
      <div className="p-5 border-t border-white/10">

        <div className="flex items-center gap-3 mb-5">

          <div className="w-11 h-11 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">
            SA
          </div>

          <div>

            <h3 className="text-white font-semibold">
              Super Admin
            </h3>

            <p className="text-gray-500 text-sm">
              Platform Owner
            </p>

          </div>

        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white py-3 rounded-xl transition"
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>

    </aside>
  );
};

export default SuperAdminSidebar;