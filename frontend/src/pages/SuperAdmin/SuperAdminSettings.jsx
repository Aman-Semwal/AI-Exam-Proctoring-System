import { useEffect, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";

const DEFAULT_SETTINGS = {
  maxConcurrentSessions: "5000",
  aiSensitivity: "High",
};

const SuperAdminSettings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(
        "superAdminSettings"
      );

      if (storedSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(storedSettings),
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, []);

  const handleChange = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem(
        "superAdminSettings",
        JSON.stringify(settings)
      );

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

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

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Platform Settings
            </h1>

            <p className="text-slate-400 mt-1 text-xs sm:text-sm">
              Configure system-wide parameters, security keys, and global
              limits.
            </p>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-white/[0.06]">
              Security Parameters
            </h3>

            <div className="space-y-5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  Max Concurrent Exam Sessions
                </label>

                <input
                  type="number"
                  min="1"
                  value={settings.maxConcurrentSessions}
                  onChange={(e) =>
                    handleChange(
                      "maxConcurrentSessions",
                      e.target.value
                    )
                  }
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-white focus:border-purple-500 outline-none transition text-xs"
                />

                <p className="text-[10px] text-slate-500 mt-1.5">
                  Maximum number of exam sessions allowed simultaneously.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">
                  AI Cheating Sensitivity Threshold
                </label>

                <select
                  value={settings.aiSensitivity}
                  onChange={(e) =>
                    handleChange(
                      "aiSensitivity",
                      e.target.value
                    )
                  }
                  className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-white focus:border-purple-500 outline-none transition text-xs"
                >
                  <option value="High">
                    High (Strict Enforcement)
                  </option>

                  <option value="Medium">
                    Medium (Balanced Threshold)
                  </option>

                  <option value="Low">
                    Low (Lenient Tolerance)
                  </option>
                </select>

                <p className="text-[10px] text-slate-500 mt-1.5">
                  Controls the frontend configuration used for AI proctoring
                  sensitivity.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition active:scale-[0.98] shadow-sm"
                >
                  Save Changes
                </button>

                {saved && (
                  <span className="text-xs text-emerald-400 font-medium">
                    Settings saved successfully.
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-[11px] text-amber-300">
              <span className="font-semibold">Note:</span>{" "}
              These settings are currently stored on this browser because
              the backend does not expose a confirmed platform-settings API.
              They can be connected to the backend later without changing
              the UI.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSettings;

