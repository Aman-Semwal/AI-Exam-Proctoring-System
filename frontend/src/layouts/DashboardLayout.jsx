import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#090a0f] flex text-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <Topbar />

        {/* Dashboard Page */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;