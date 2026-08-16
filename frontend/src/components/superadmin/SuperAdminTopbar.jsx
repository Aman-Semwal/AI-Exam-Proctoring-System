import {
  FaBell,
  FaSearch,
  FaUserCircle,
} from "react-icons/fa";

const SuperAdminTopbar = () => {

  return (
    <header className="h-20 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">

      {/* Left */}
      <div>

        <h2 className="text-xl lg:text-2xl font-bold text-white">
          Good Morning, Admin 👋
        </h2>

        <p className="text-gray-500 text-sm">
          Platform overview and management
        </p>

      </div>

      {/* Right */}
      <div className="flex items-center gap-3">

        {/* Search */}
        <div className="hidden md:flex items-center bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5">

          <FaSearch className="text-gray-500" />

          <input
            type="text"
            placeholder="Search platform..."
            className="ml-3 w-40 lg:w-56 bg-transparent outline-none text-white placeholder-gray-500"
          />

        </div>

        {/* Notification */}
        <button
          className="relative w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-gray-300 transition"
        >

          <FaBell />

          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />

        </button>

        {/* Profile */}
        <button className="flex items-center gap-3 ml-2">

          <FaUserCircle className="text-cyan-400 text-4xl" />

          <div className="hidden lg:block text-left">

            <p className="text-white font-semibold">
              Super Admin
            </p>

            <p className="text-gray-500 text-xs">
              Administrator
            </p>

          </div>

        </button>

      </div>

    </header>
  );
};

export default SuperAdminTopbar;