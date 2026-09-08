import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminSettings = () => {
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-4xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Configuration
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Platform Settings</h1>
            <p className="text-slate-400 mt-1 text-xs sm:text-sm">Configure system-wide parameters, security keys, and global limits.</p>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-white/[0.06]">Security Parameters</h3>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Max Concurrent Exam Sessions</label>
                <input
                  type="text"
                  defaultValue="5,000"
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-white focus:border-purple-500 outline-none transition text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">AI Cheating Sensitivity Threshold</label>
                <select className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-white focus:border-purple-500 outline-none transition text-xs">
                  <option>High (Strict Enforcement)</option>
                  <option>Medium (Balanced Threshold)</option>
                  <option>Low (Lenient Tolerance)</option>
                </select>
              </div>

              <div className="pt-2">
                <button className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition active:scale-[0.98] shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSettings;