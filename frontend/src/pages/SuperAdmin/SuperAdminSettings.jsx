import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const SuperAdminSettings = () => {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />
        
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
            <p className="text-gray-400 mt-1 text-sm">Configure system-wide parameters, security keys, and global limits.</p>
          </div>

          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">Security Parameters</h3>
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-gray-400 mb-1">Max Concurrent Exam Sessions</label>
                <input type="text" defaultValue="5,000" className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">AI Cheating Sensitivity Threshold</label>
                <select className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-cyan-500 outline-none">
                  <option>High (Strict)</option>
                  <option>Medium (Balanced)</option>
                  <option>Low (Lenient)</option>
                </select>
              </div>
              <button className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm transition hover:bg-cyan-400">
                Save Changes
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default SuperAdminSettings;