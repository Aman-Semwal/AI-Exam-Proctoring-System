import { useEffect, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import {
  FaServer,
  FaDatabase,
  FaMicrochip,
  FaCheckCircle,
  FaTimesCircle,
  FaRedo,
} from "react-icons/fa";
import api from "../../services/api";

const SuperAdminSystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/health");

      const data = response?.data?.data ?? response?.data;

      setHealth(data);
    } catch (err) {
      console.error("Failed to fetch system health:", err);

      setHealth(null);
      setError(
        err.response?.data?.message ||
          "Unable to connect to the backend health service."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const isHealthy =
    !error &&
    (
      health === "UP" ||
      health?.status === "UP" ||
      health?.healthy === true ||
      health?.status?.toUpperCase?.() === "UP"
    );

  const getHealthLabel = () => {
    if (loading) return "Checking...";
    if (error) return "Unavailable";
    if (isHealthy) return "Operational";
    return "Response Received";
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Infrastructure
            </span>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                  System Health & Diagnostics
                </h1>

                <p className="text-slate-400 mt-1 text-xs sm:text-sm">
                  Monitor the availability of platform infrastructure and backend services.
                </p>
              </div>

              <button
                onClick={fetchHealth}
                disabled={loading}
                className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.08] bg-[#121520] text-xs text-slate-300 hover:text-white hover:bg-white/[0.05] transition disabled:opacity-50"
              >
                <FaRedo
                  size={10}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-8 text-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />

              <p className="text-sm text-slate-400">
                Checking system health...
              </p>
            </div>
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 flex items-center gap-3.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <FaTimesCircle size={16} />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-rose-400 text-xs sm:text-sm">
                  Backend Health Check Failed
                </h3>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  {error}
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`border rounded-xl p-4 flex items-center gap-3.5 mb-6 ${
                isHealthy
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                  isHealthy
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {isHealthy ? (
                  <FaCheckCircle size={16} />
                ) : (
                  <FaServer size={16} />
                )}
              </div>

              <div>
                <h3
                  className={`font-semibold text-xs sm:text-sm ${
                    isHealthy
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}
                >
                  {getHealthLabel()}
                </h3>

                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live response received from the platform health endpoint.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <FaServer size={16} />
              </div>

              <h3 className="font-semibold text-white text-sm">
                API Server
              </h3>

              <p
                className={`text-2xl font-bold mt-2 font-mono ${
                  error ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {loading ? "..." : error ? "DOWN" : "UP"}
              </p>

              <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
                {loading
                  ? "Checking backend..."
                  : error
                  ? "Health endpoint unavailable"
                  : "Backend health check successful"}
              </span>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <FaDatabase size={16} />
              </div>

              <h3 className="font-semibold text-white text-sm">
                Database
              </h3>

              <p className="text-2xl font-bold mt-2 font-mono text-slate-300">
                N/A
              </p>

              <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
                No dedicated database health endpoint confirmed
              </span>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <FaMicrochip size={16} />
              </div>

              <h3 className="font-semibold text-white text-sm">
                AI Proctoring Engine
              </h3>

              <p className="text-2xl font-bold mt-2 font-mono text-slate-300">
                N/A
              </p>

              <span className="text-xs text-slate-400 font-medium mt-1 inline-block">
                No dedicated AI health endpoint confirmed
              </span>
            </div>
          </div>

          {!loading && !error && (
            <div className="mt-5 bg-[#121520] border border-white/[0.07] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-2">
                Health Response
              </h3>

              <pre className="text-xs text-slate-400 bg-[#090a0f] border border-white/[0.06] rounded-lg p-4 overflow-x-auto">
                {typeof health === "string"
                  ? health
                  : JSON.stringify(health, null, 2)}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminSystemHealth;
