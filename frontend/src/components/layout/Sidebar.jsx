import {
  FaHome,
  FaClipboardList,
  FaChartBar,
  FaUser,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {

  const navigate = useNavigate();

  const location = useLocation();

  const handleLogout = () => {

    localStorage.removeItem("isLoggedIn");

    navigate("/");

  };

  const menus = [
    {
      icon: <FaHome />,
      title: "Dashboard",
      path: "/student/dashboard",
    },
    {
      icon: <FaClipboardList />,
      title: "Live Exam",
      path: "/live-exam",
    },
    {
      icon: <FaChartBar />,
      title: "Results",
      path: "/results",
    },
    {
      icon: <FaUser />,
      title: "Profile",
      path: "/profile",
    },
    {
      icon: <FaCog />,
      title: "Settings",
      path: "/settings",
    },
  ];

  return (
    <aside className="w-72 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col justify-between">

      <div>

        {/* Logo */}

        <div
          onClick={() => navigate("/student/dashboard")}
          className="p-8 border-b border-white/10 cursor-pointer"
        >

          <h1 className="text-3xl font-bold text-white">

            Proctor

            <span className="text-cyan-400">
              AI
            </span>

          </h1>

          <p className="text-gray-400 text-sm mt-2">

            AI Exam Monitoring

          </p>

        </div>

        {/* Menu */}

        <div className="p-5 space-y-3">

          {menus.map((item, index) => (

            <div
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300
              ${
                location.pathname === item.path
                  ? "bg-cyan-500 text-black"
                  : "text-gray-300 hover:bg-slate-800 hover:text-cyan-400"
              }`}
            >

              {item.icon}

              <span className="font-medium">
                {item.title}
              </span>

            </div>

          ))}

        </div>

      </div>

      {/* Bottom */}

      <div className="p-6 border-t border-white/10">

        <div className="flex items-center gap-4">

          <div className="w-12 h-12 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-black">

            A

          </div>

          <div>

            <h3 className="text-white font-semibold">

              Anchal Saini

            </h3>

            <p className="text-gray-400 text-sm">

              Student

            </p>

          </div>

        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full flex items-center justify-center gap-3 bg-red-500 hover:bg-red-600 py-3 rounded-xl text-white transition"
        >

          <FaSignOutAlt />

          Logout

        </button>

      </div>

    </aside>
  );
};

export default Sidebar;