import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import {
  FaMoon,
  FaBell,
  FaLock,
  FaEnvelope,
  FaUserCog,
  FaSignOutAlt,
} from "react-icons/fa";

import api from "../../services/api";

const Settings = () => {
  const navigate = useNavigate();

  const [account, setAccount] = useState({
    name: "",
    email: "",
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    darkMode: true,
    emailUpdates: true,
  });

  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/users/me");
        const data = response.data?.data || {};

        setAccount({
          name: data.name || "",
          email: data.email || "",
        });

        const savedPreferences = JSON.parse(
          localStorage.getItem("userPreferences") || "{}"
        );

        setPreferences((prev) => ({
          ...prev,
          ...savedPreferences,
        }));

        setRecoveryEmail(
          localStorage.getItem("recoveryEmail") || data.email || ""
        );
      } catch (err) {
        console.error("Failed to load settings:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load your account settings."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;

    setAccount((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handlePreferenceChange = (name) => {
    setPreferences((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));

    setMessage("");
    setError("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage("");
      setError("");

      // Update account information through backend
      const response = await api.put("/users/me", {
        name: account.name,
        email: account.email,
      });

      const updatedUser = response.data?.data;

      if (updatedUser) {
        setAccount({
          name: updatedUser.name || account.name,
          email: updatedUser.email || account.email,
        });

        const oldUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            ...updatedUser,
          })
        );
      }

      // Save frontend preferences locally
      localStorage.setItem(
        "userPreferences",
        JSON.stringify(preferences)
      );

      localStorage.setItem("recoveryEmail", recoveryEmail);

      setMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Failed to save settings:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save your settings."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);

      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Settings
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage your account preferences and security configurations.
            </p>
          </div>

          {loading ? (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-10 text-center">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-sm text-slate-400">
                Loading settings...
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {message && (
                <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                  <p className="text-xs text-emerald-300">
                    {message}
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Account Settings */}
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                    <FaUserCog className="text-blue-400 text-sm" />

                    <h3 className="text-sm font-semibold text-white">
                      Account Settings
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Username
                      </label>

                      <input
                        name="name"
                        value={account.name}
                        onChange={handleAccountChange}
                        placeholder="Username"
                        className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Email
                      </label>

                      <input
                        name="email"
                        type="email"
                        value={account.email}
                        onChange={handleAccountChange}
                        placeholder="Email"
                        className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                    <FaBell className="text-amber-400 text-sm" />

                    <h3 className="text-sm font-semibold text-white">
                      Notifications
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                      <span>Email Notifications</span>

                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={() =>
                          handlePreferenceChange("emailNotifications")
                        }
                        className="accent-blue-600 rounded"
                      />
                    </label>

                    <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                      <span>Push Notifications</span>

                      <input
                        type="checkbox"
                        checked={preferences.pushNotifications}
                        onChange={() =>
                          handlePreferenceChange("pushNotifications")
                        }
                        className="accent-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Change Password */}
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                    <FaLock className="text-rose-400 text-sm" />

                    <h3 className="text-sm font-semibold text-white">
                      Change Password
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Current Password
                      </label>

                      <input
                        type="password"
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="Current Password"
                        className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        New Password
                      </label>

                      <input
                        type="password"
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="New Password"
                        className="w-full bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Password update will be enabled when the backend
                      password endpoint is available.
                    </p>
                  </div>
                </div>

                {/* Preferences */}
                <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                    <FaMoon className="text-blue-400 text-sm" />

                    <h3 className="text-sm font-semibold text-white">
                      Preferences
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                      <span>Dark Mode</span>

                      <input
                        type="checkbox"
                        checked={preferences.darkMode}
                        onChange={() =>
                          handlePreferenceChange("darkMode")
                        }
                        className="accent-blue-600 rounded"
                      />
                    </label>

                    <label className="flex justify-between items-center text-slate-300 py-1 cursor-pointer">
                      <span>Email Updates</span>

                      <input
                        type="checkbox"
                        checked={preferences.emailUpdates}
                        onChange={() =>
                          handlePreferenceChange("emailUpdates")
                        }
                        className="accent-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Recovery Email */}
              <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm mt-5">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
                  <FaEnvelope className="text-blue-400 text-sm" />

                  <h3 className="text-sm font-semibold text-white">
                    Recovery Email
                  </h3>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-400 mb-1">
                    Backup Address
                  </label>

                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="Recovery Email"
                    className="w-full sm:w-96 bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center justify-center gap-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 disabled:opacity-50 px-5 py-2.5 rounded-lg text-xs font-semibold text-red-300 transition"
                >
                  <FaSignOutAlt size={12} />

                  {loggingOut ? "Logging out..." : "Logout"}
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-xs font-semibold text-white transition active:scale-[0.98] shadow-sm"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;