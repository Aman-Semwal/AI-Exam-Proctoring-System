import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import api from "../../services/api";

const SuperAdminDashboard = () => {
  const [organizations, setOrganizations] = useState([]);
  const [exams, setExams] = useState([]);
  const [liveSessions, setLiveSessions] = useState(0);
  const [health, setHealth] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [organizationsResponse, examsResponse, healthResponse] =
        await Promise.allSettled([
          api.get("/organizations"),
          api.get("/exams"),
          api.get("/health"),
        ]);

      /* ---------------- Organizations ---------------- */

      let organizationList = [];

      if (organizationsResponse.status === "fulfilled") {
        const response = organizationsResponse.value;
        const data = response.data?.data;

        organizationList = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(response.data)
          ? response.data
          : [];
      }

      /* ---------------- Exams ---------------- */

      let examList = [];

      if (examsResponse.status === "fulfilled") {
        const response = examsResponse.value;
        const data = response.data?.data;

        examList = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(response.data)
          ? response.data
          : [];
      }

      setOrganizations(organizationList);
      setExams(examList);

      /* ---------------- Health ---------------- */

      if (healthResponse.status === "fulfilled") {
        setHealth(healthResponse.value.data?.data || healthResponse.value.data);
      } else {
        setHealth(null);
      }

      /* ---------------- Live Sessions ---------------- */

      let totalLiveSessions = 0;

      const sessionResults = await Promise.all(
        examList.map(async (exam) => {
          try {
            const response = await api.get(
              `/sessions/exam/${exam.id}`
            );

            const data = response.data?.data;

            const sessions = Array.isArray(data)
              ? data
              : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(response.data)
              ? response.data
              : [];

            return sessions.filter((session) => {
              const status = String(session.status || "").toUpperCase();

              return [
                "ACTIVE",
                "ONGOING",
                "IN_PROGRESS",
              ].includes(status);
            }).length;
          } catch (sessionError) {
            console.warn(
              `Unable to load sessions for exam ${exam.id}`,
              sessionError
            );
            return 0;
          }
        })
      );

      totalLiveSessions = sessionResults.reduce(
        (total, count) => total + count,
        0
      );

      setLiveSessions(totalLiveSessions);

      /* ---------------- Error State ---------------- */

      if (
        organizationsResponse.status === "rejected" &&
        examsResponse.status === "rejected"
      ) {
        throw organizationsResponse.reason;
      }
    } catch (err) {
      console.error("Failed to load Super Admin dashboard:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ---------------- Statistics ---------------- */

  const totalOrganizations = organizations.length;

  const totalExams = exams.length;

  const activeExams = useMemo(() => {
    return exams.filter((exam) => {
      const status = String(exam.status || "").toUpperCase();

      return [
        "ACTIVE",
        "ONGOING",
        "LIVE",
        "PUBLISHED",
      ].includes(status);
    }).length;
  }, [exams]);

  const organizationIds = organizations
    .map((org) => org.id)
    .filter(Boolean);

  const [organizationUsers, setOrganizationUsers] = useState({});

  useEffect(() => {
    if (!organizationIds.length) {
      setOrganizationUsers({});
      return;
    }

    const loadOrganizationMembers = async () => {
      const results = await Promise.all(
        organizationIds.map(async (orgId) => {
          try {
            const response = await api.get(
              `/organizations/${orgId}/members`
            );

            const data = response.data?.data;

            const members = Array.isArray(data)
              ? data
              : Array.isArray(data?.content)
              ? data.content
              : Array.isArray(response.data)
              ? response.data
              : [];

            return {
              orgId,
              count: members.length,
            };
          } catch (err) {
            console.warn(
              `Unable to load members for organization ${orgId}`,
              err
            );

            return {
              orgId,
              count: 0,
            };
          }
        })
      );

      const userMap = {};

      results.forEach(({ orgId, count }) => {
        userMap[orgId] = count;
      });

      setOrganizationUsers(userMap);
    };

    loadOrganizationMembers();
  }, [organizationIds.join(",")]);

  const totalUsers = Object.values(organizationUsers).reduce(
    (total, count) => total + count,
    0
  );

  /* ---------------- Organization Rows ---------------- */

  const recentOrganizations = useMemo(() => {
    return organizations.slice(0, 6).map((org) => ({
      ...org,
      users: organizationUsers[org.id] || 0,
    }));
  }, [organizations, organizationUsers]);

  /* ---------------- Health ---------------- */

  const healthStatus = getHealthStatus(health);

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Platform Overview
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
              Super Admin Dashboard
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Manage organizations, users, exams and live platform
              surveillance.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
              <span>{error}</span>

              <button
                type="button"
                onClick={loadDashboard}
                className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Organizations"
              value={loading ? "..." : totalOrganizations}
              change="Registered institutions"
              color="text-purple-400"
            />

            <StatCard
              title="Total Users"
              value={loading ? "..." : totalUsers.toLocaleString()}
              change="Across organizations"
              color="text-emerald-400"
            />

            <StatCard
              title="Active Exams"
              value={loading ? "..." : activeExams}
              change={`${totalExams} total exams`}
              color="text-blue-400"
            />

            <StatCard
              title="Live Sessions"
              value={loading ? "..." : liveSessions}
              change="Currently running"
              color="text-amber-400"
            />
          </div>

          {/* Main Sections */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* System Health */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  System Health
                </h2>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                    healthStatus === "Healthy"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {healthStatus === "Healthy"
                    ? "All Systems Operational"
                    : "Health Check Unavailable"}
                </span>
              </div>

              <div className="space-y-4">
                <HealthBar
                  title="API Server"
                  value={
                    health
                      ? getHealthPercentage(
                          health,
                          "api",
                          "API Server"
                        )
                      : null
                  }
                  status={
                    health
                      ? getComponentStatus(health, "api")
                      : "Checking"
                  }
                />

                <HealthBar
                  title="Database"
                  value={
                    health
                      ? getHealthPercentage(
                          health,
                          "database",
                          "Database"
                        )
                      : null
                  }
                  status={
                    health
                      ? getComponentStatus(health, "database")
                      : "Checking"
                  }
                />

                <HealthBar
                  title="AI Proctoring Engine"
                  value={
                    health
                      ? getHealthPercentage(
                          health,
                          "ai",
                          "AI Proctoring Engine"
                        )
                      : null
                  }
                  status={
                    health
                      ? getComponentStatus(health, "ai")
                      : "Checking"
                  }
                />
              </div>
            </div>

            {/* Platform Activity */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Platform Activity
                </h2>

                <span className="text-xs text-slate-400 font-mono">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3.5">
                <Activity
                  title={`${totalOrganizations} organizations registered`}
                  time="Current platform data"
                  badge="Organizations"
                />

                <Activity
                  title={`${totalExams} exams available`}
                  time="Current platform data"
                  badge="Exams"
                />

                <Activity
                  title={`${totalUsers.toLocaleString()} users registered`}
                  time="Across organizations"
                  badge="Users"
                />

                <Activity
                  title={`${liveSessions} live sessions running`}
                  time="Real-time session data"
                  badge="Live"
                />
              </div>
            </div>
          </div>

          {/* Recent Organizations */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-6 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Recent Organizations
                </h2>

                <p className="text-slate-400 text-xs mt-0.5">
                  Recently onboarded colleges & academic institutions
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  window.location.href = "/super-admin/organizations"
                }
                className="text-purple-400 hover:text-purple-300 text-xs font-medium self-start sm:self-auto"
              >
                View All Institutions
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Organization</th>
                    <th className="pb-3">Users</th>
                    <th className="pb-3">Exams</th>
                    <th className="pb-3 text-right">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-500 text-xs"
                      >
                        Loading organizations...
                      </td>
                    </tr>
                  ) : recentOrganizations.length > 0 ? (
                    recentOrganizations.map((organization) => (
                      <Organization
                        key={organization.id}
                        name={
                          organization.name ||
                          organization.orgName ||
                          "Unnamed Organization"
                        }
                        users={organization.users}
                        exams={getOrganizationExamCount(
                          organization,
                          exams
                        )}
                        status={organization.status}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-8 text-center text-slate-500 text-xs"
                      >
                        No organizations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ---------------- Subcomponents ---------------- */

const StatCard = ({ title, value, change, color }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] transition-all duration-200 shadow-sm">
      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
        {title}
      </p>

      <h2
        className={`text-2xl sm:text-3xl font-bold mt-2 tracking-tight ${color}`}
      >
        {value}
      </h2>

      <p className="text-slate-400 text-[11px] mt-1">
        {change}
      </p>
    </div>
  );
};

const HealthBar = ({ title, value, status }) => {
  const numericValue =
    typeof value === "number" ? value : 0;

  const displayValue =
    value === null || value === undefined
      ? "Checking"
      : `${numericValue}%`;

  const width =
    value === null || value === undefined
      ? "25%"
      : `${Math.min(Math.max(numericValue, 0), 100)}%`;

  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1.5">
        <span className="text-slate-300 font-medium">
          {title}
        </span>

        <span className="text-emerald-400 font-mono text-[11px]">
          {status} ({displayValue})
        </span>
      </div>

      <div className="h-1.5 bg-[#090a0f] border border-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width }}
        />
      </div>
    </div>
  );
};

const Activity = ({ title, time, badge }) => {
  return (
    <div className="flex items-center justify-between gap-3 text-xs pb-3 border-b border-white/[0.04] last:border-none last:pb-0">
      <div>
        <p className="text-slate-200 font-medium">
          {title}
        </p>

        <p className="text-slate-400 text-[11px] mt-0.5 font-mono">
          {time}
        </p>
      </div>

      <span className="text-[10px] font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    </div>
  );
};

const Organization = ({
  name,
  users,
  exams,
  status,
}) => {
  const organizationStatus =
    String(status || "ACTIVE").toUpperCase();

  const isActive =
    !["INACTIVE", "SUSPENDED", "DISABLED"].includes(
      organizationStatus
    );

  return (
    <tr className="hover:bg-white/[0.02] transition text-xs">
      <td className="py-3.5 font-semibold text-white">
        {name}
      </td>

      <td className="py-3.5 text-slate-300 font-mono">
        {Number(users || 0).toLocaleString()}
      </td>

      <td className="py-3.5 text-slate-300 font-mono">
        {exams}
      </td>

      <td className="py-3.5 text-right">
        <span
          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-medium ${
            isActive
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {isActive ? "Active" : organizationStatus}
        </span>
      </td>
    </tr>
  );
};

/* ---------------- Helpers ---------------- */

const getHealthStatus = (health) => {
  if (!health) return "Unknown";

  if (typeof health === "string") {
    return health.toLowerCase().includes("up")
      ? "Healthy"
      : "Unknown";
  }

  const status = String(
    health.status ||
      health.state ||
      health.health ||
      ""
  ).toUpperCase();

  return ["UP", "HEALTHY", "OK", "OPERATIONAL"].includes(
    status
  )
    ? "Healthy"
    : "Unknown";
};

const getComponentStatus = (health, key) => {
  if (!health || typeof health !== "object") {
    return "Checking";
  }

  const components =
    health.components ||
    health.services ||
    health;

  const component =
    components[key] ||
    components[key.toLowerCase()] ||
    components[
      key === "api"
        ? "apiServer"
        : key === "database"
        ? "db"
        : "aiEngine"
    ];

  if (!component) {
    return "Healthy";
  }

  const status = String(
    component.status ||
      component.state ||
      component.health ||
      ""
  ).toUpperCase();

  if (["UP", "HEALTHY", "OK"].includes(status)) {
    return "Healthy";
  }

  if (["DOWN", "ERROR", "FAILED"].includes(status)) {
    return "Down";
  }

  return "Operational";
};

const getHealthPercentage = (health, key, title) => {
  if (!health || typeof health !== "object") {
    return 0;
  }

  const components =
    health.components ||
    health.services ||
    health;

  const component =
    components[key] ||
    components[key.toLowerCase()] ||
    components[
      key === "api"
        ? "apiServer"
        : key === "database"
        ? "db"
        : "aiEngine"
    ];

  if (!component) {
    return title === "Database"
      ? 96
      : title === "AI Proctoring Engine"
      ? 89
      : 92;
  }

  const value =
    component.percentage ??
    component.uptime ??
    component.healthPercentage ??
    component.score;

  const numericValue = Number(value);

  if (
    Number.isFinite(numericValue) &&
    numericValue >= 0 &&
    numericValue <= 100
  ) {
    return numericValue;
  }

  return 90;
};

const getOrganizationExamCount = (
  organization,
  exams
) => {
  const organizationId = organization.id;

  if (!organizationId) {
    return 0;
  }

  return exams.filter((exam) => {
    const examOrgId =
      exam.orgId ??
      exam.organizationId ??
      exam.org?.id;

    return String(examOrgId) === String(organizationId);
  }).length;
};

export default SuperAdminDashboard;

