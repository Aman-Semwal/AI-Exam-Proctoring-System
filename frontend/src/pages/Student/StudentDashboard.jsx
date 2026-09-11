import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import PerformanceChart from "../../components/charts/PerformanceChart";
import CircularProgress from "../../components/dashboard/CircularProgress";
import AIStatusCard from "../../components/dashboard/AIStatusCard";
import CalendarWidget from "../../components/dashboard/CalendarWidget";
import RecentActivity from "../../components/dashboard/RecentActivity";
import {
  FaBook,
  FaCheckCircle,
  FaClock,
  FaStar,
  FaSearch,
} from "react-icons/fa";
import api from "../../services/api";

const StatCard = ({ title, value, accent }) => (
  <div className="card p-5">
    <p
      className="text-xs font-medium uppercase tracking-wider"
      style={{ color: "var(--text-muted)" }}
    >
      {title}
    </p>

    <p
      className="text-2xl sm:text-3xl font-bold mt-2 tracking-tight"
      style={{ color: accent || "var(--text-primary)" }}
    >
      {value}
    </p>
  </div>
);

export default function StudentDashboard() {
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = JSON.parse(
          localStorage.getItem("user") || "null"
        );

        // Get current logged-in user
        const userResponse = await api.get("/users/me");
        const currentUser =
          userResponse.data?.data || userResponse.data;

        setUser(currentUser || storedUser);

        // Get student's exam sessions
        const sessionsResponse = await api.get("/sessions/my");
        const sessionData =
          sessionsResponse.data?.data ||
          sessionsResponse.data ||
          [];

        setSessions(Array.isArray(sessionData) ? sessionData : []);

        // Assignments are optional for the dashboard
        try {
          const studentId = currentUser?.id || storedUser?.id;

          if (studentId) {
            const assignmentsResponse = await api.get(
              `/assignments/student/${studentId}`
            );

            const assignmentData =
              assignmentsResponse.data?.data ||
              assignmentsResponse.data ||
              [];

            setAssignments(
              Array.isArray(assignmentData)
                ? assignmentData
                : []
            );
          }
        } catch (assignmentError) {
          console.warn(
            "Assignments could not be loaded:",
            assignmentError
          );

          setAssignments([]);
        }
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (err.response?.status !== 401) {
          setError(
            "Dashboard data could not be loaded. Please try again later."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const completedSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          session.status === "COMPLETED" ||
          session.status === "completed" ||
          session.endTime ||
          session.endedAt
      ),
    [sessions]
  );

  const upcomingAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status !== "COMPLETED" &&
          assignment.status !== "completed"
      ),
    [assignments]
  );

  const averageScore = useMemo(() => {
    const scoredSessions = completedSessions.filter(
      (session) =>
        typeof session.score === "number" ||
        typeof session.percentage === "number"
    );

    if (!scoredSessions.length) return 0;

    const total = scoredSessions.reduce(
      (sum, session) =>
        sum + Number(
          session.percentage ??
          session.score ??
          0
        ),
      0
    );

    return Math.round(
      total / scoredSessions.length
    );
  }, [completedSessions]);

  const resultArchives = useMemo(() => {
    return completedSessions.map((session, index) => {
      const score =
        session.percentage ??
        session.score ??
        session.marks ??
        0;

      const examName =
        session.exam?.title ||
        session.examTitle ||
        session.exam?.name ||
        `Examination ${index + 1}`;

      const dateValue =
        session.endTime ||
        session.endedAt ||
        session.createdAt;

      let date = "-";

      if (dateValue) {
        const parsedDate = new Date(dateValue);

        if (!Number.isNaN(parsedDate.getTime())) {
          date = parsedDate.toLocaleDateString(
            "en-IN",
            {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }
          );
        }
      }

      const numericScore = Number(score);

      let grade = "F";

      if (numericScore >= 90) grade = "A+";
      else if (numericScore >= 80) grade = "A";
      else if (numericScore >= 70) grade = "B+";
      else if (numericScore >= 60) grade = "B";
      else if (numericScore >= 50) grade = "C";

      return {
        id: session.id || index,
        exam: examName,
        score:
          session.maxScore || session.totalMarks
            ? `${score}/${
                session.maxScore ||
                session.totalMarks
              }`
            : `${score}%`,
        percentage: numericScore,
        grade,
        status:
          numericScore >= 40
            ? "Passed"
            : "Failed",
        date,
      };
    });
  }, [completedSessions]);

  const filtered = resultArchives.filter(
    (result) =>
      result.exam
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      result.grade
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const displayName =
    user?.name ||
    user?.fullName ||
    JSON.parse(
      localStorage.getItem("user") || "null"
    )?.name ||
    "Student";

  const firstName = displayName.split(" ")[0];

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "var(--bg-base)" }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          title="Student Dashboard"
          breadcrumb="Student Portal"
        />

        <main className="p-6 lg:p-8 space-y-7 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">

          {/* Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5"
            style={{
              borderBottom:
                "1px solid var(--border)",
            }}
          >
            <div>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{
                  color:
                    "var(--text-primary)",
                }}
              >
                Good Morning, {firstName} 👋
              </h2>

              <p
                className="mt-1 text-xs sm:text-sm"
                style={{
                  color:
                    "var(--text-secondary)",
                }}
              >
                Welcome to your student portal.
                Check your upcoming assessments and
                performance.
              </p>
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 active:scale-[0.97] w-fit"
              onClick={() => {
                window.location.href =
                  "/student/live-exam";
              }}
            >
              Take Active Exam
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div
              className="card p-4 text-xs"
              style={{
                color:
                  "var(--text-secondary)",
              }}
            >
              Loading your dashboard data...
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="card p-4 text-xs"
              style={{ color: "#ef4444" }}
            >
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Exams"
              value={
                sessions.length +
                assignments.length
              }
              accent="#3b82f6"
            />

            <StatCard
              title="Completed"
              value={
                completedSessions.length
              }
              accent="#10b981"
            />

            <StatCard
              title="Upcoming"
              value={
                upcomingAssignments.length
              }
              accent="#f59e0b"
            />

            <StatCard
              title="Average Score"
              value={`${averageScore}%`}
              accent="#8b5cf6"
            />
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                Icon: FaBook,
                label: "Total Sessions",
                val: sessions.length,
                color: "#3b82f6",
              },
              {
                Icon: FaCheckCircle,
                label: "Passed",
                val: resultArchives.filter(
                  (r) =>
                    r.status === "Passed"
                ).length,
                color: "#10b981",
              },
              {
                Icon: FaClock,
                label: "Upcoming Exams",
                val:
                  upcomingAssignments.length,
                color: "#f59e0b",
              },
              {
                Icon: FaStar,
                label: "Average Score",
                val: `${averageScore}%`,
                color: "#8b5cf6",
              },
            ].map(
              ({
                Icon,
                label,
                val,
                color,
              }) => (
                <div
                  key={label}
                  className="card p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-xs"
                      style={{
                        color:
                          "var(--text-muted)",
                      }}
                    >
                      {label}
                    </p>

                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{
                        background: `${color}1a`,
                        border: `1px solid ${color}40`,
                        color,
                      }}
                    >
                      <Icon size={13} />
                    </div>
                  </div>

                  <p
                    className="text-xl font-bold"
                    style={{
                      color:
                        "var(--text-primary)",
                    }}
                  >
                    {val}
                  </p>
                </div>
              )
            )}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>

            <CircularProgress
              percentage={averageScore}
            />
          </div>

          {/* AI Status + Calendar */}
          <div className="grid lg:grid-cols-2 gap-6">
            <AIStatusCard />
            <CalendarWidget />
          </div>

          {/* Upcoming Exams + Results */}
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Upcoming */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-sm font-bold"
                  style={{
                    color:
                      "var(--text-primary)",
                  }}
                >
                  Upcoming Exams
                </h3>

                <span
                  className="text-xs font-mono"
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                >
                  {
                    upcomingAssignments.length
                  }{" "}
                  Scheduled
                </span>
              </div>

              <div className="space-y-3">
                {upcomingAssignments.length >
                0 ? (
                  upcomingAssignments
                    .slice(0, 3)
                    .map(
                      (
                        assignment,
                        index
                      ) => {
                        const examName =
                          assignment.exam
                            ?.title ||
                          assignment.examTitle ||
                          assignment.exam
                            ?.name ||
                          `Assigned Exam ${
                            index + 1
                          }`;

                        const examDate =
                          assignment.exam
                            ?.startTime ||
                          assignment.startTime ||
                          assignment.scheduledAt;

                        let formattedDate =
                          "Date not available";

                        if (examDate) {
                          const parsedDate =
                            new Date(
                              examDate
                            );

                          if (
                            !Number.isNaN(
                              parsedDate.getTime()
                            )
                          ) {
                            formattedDate =
                              parsedDate.toLocaleString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              );
                          }
                        }

                        return (
                          <div
                            key={
                              assignment.id ||
                              index
                            }
                            className="card p-4"
                          >
                            <div className="flex items-center justify-between">
                              <p
                                className="text-xs font-bold"
                                style={{
                                  color:
                                    "var(--text-primary)",
                                }}
                              >
                                {examName}
                              </p>

                              <span className="badge-info px-2 py-0.5 rounded-full text-[10px] font-medium">
                                Upcoming
                              </span>
                            </div>

                            <p
                              className="text-[11px] mt-1.5 font-mono"
                              style={{
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              {
                                formattedDate
                              }
                            </p>

                            <button
                              className="mt-3 w-full bg-blue-600 hover:bg-blue-500 text-white py-1.5 rounded-lg text-xs font-semibold transition"
                              onClick={() => {
                                const examId =
                                  assignment.examId ||
                                  assignment.exam
                                    ?.id ||
                                  assignment.id;

                                if (examId) {
                                  window.location.href = `/student/live-exam?examId=${examId}`;
                                }
                              }}
                            >
                              Start Exam
                            </button>
                          </div>
                        );
                      }
                    )
                ) : (
                  <div
                    className="card p-5 text-center text-xs"
                    style={{
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    No upcoming exams assigned.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Results */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3
                  className="text-sm font-bold"
                  style={{
                    color:
                      "var(--text-primary)",
                  }}
                >
                  Recent Results
                </h3>

                <span
                  className="text-xs font-mono"
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Latest 3
                </span>
              </div>

              <div className="space-y-3">
                {resultArchives.length >
                0 ? (
                  resultArchives
                    .slice(0, 3)
                    .map((result) => (
                      <div
                        key={result.id}
                        className="card p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p
                            className="text-xs font-bold"
                            style={{
                              color:
                                "var(--text-primary)",
                            }}
                          >
                            {result.exam}
                          </p>

                          <span className="badge-active px-2 py-0.5 rounded-full text-[10px] font-medium">
                            {result.status}
                          </span>
                        </div>

                        <div
                          className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5"
                          style={{
                            borderTop:
                              "1px solid var(--border)",
                          }}
                        >
                          <div>
                            <p
                              className="text-[10px]"
                              style={{
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              Score
                            </p>

                            <p
                              className="text-sm font-bold"
                              style={{
                                color:
                                  "var(--text-primary)",
                              }}
                            >
                              {
                                result.percentage
                              }
                              %
                            </p>
                          </div>

                          <div>
                            <p
                              className="text-[10px]"
                              style={{
                                color:
                                  "var(--text-muted)",
                              }}
                            >
                              Grade
                            </p>

                            <p className="text-sm font-bold text-blue-500">
                              {result.grade}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div
                    className="card p-5 text-center text-xs"
                    style={{
                      color:
                        "var(--text-muted)",
                    }}
                  >
                    No completed exam results
                    yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Searchable Results Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3
                  className="text-sm font-bold"
                  style={{
                    color:
                      "var(--text-primary)",
                  }}
                >
                  Result Archives
                </h3>

                <p
                  className="text-xs"
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                >
                  Historical examination
                  performance records
                </p>
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg w-full sm:w-72"
                style={{
                  background:
                    "var(--bg-card)",
                  border:
                    "1px solid var(--border)",
                }}
              >
                <FaSearch
                  size={11}
                  style={{
                    color:
                      "var(--text-muted)",
                  }}
                />

                <input
                  type="text"
                  placeholder="Search by exam or grade..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="flex-1 bg-transparent text-xs outline-none"
                  style={{
                    color:
                      "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div className="card overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead>
                  <tr
                    style={{
                      borderBottom:
                        "1px solid var(--border)",
                      background:
                        "var(--bg-raised)",
                    }}
                  >
                    {[
                      "Examination",
                      "Score",
                      "Grade",
                      "Date",
                      "Status",
                    ].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="py-3 px-4 text-[10px] font-semibold uppercase tracking-wider"
                          style={{
                            color:
                              "var(--text-muted)",
                          }}
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filtered.length > 0 ? (
                    filtered.map(
                      (result) => (
                        <tr
                          key={result.id}
                          className="table-row-hover transition"
                          style={{
                            borderBottom:
                              "1px solid var(--border)",
                          }}
                        >
                          <td
                            className="py-3 px-4 text-xs font-medium"
                            style={{
                              color:
                                "var(--text-primary)",
                            }}
                          >
                            {result.exam}
                          </td>

                          <td className="py-3 px-4 text-xs font-mono font-bold text-blue-500">
                            {result.score}
                          </td>

                          <td
                            className="py-3 px-4 text-xs font-medium"
                            style={{
                              color:
                                "var(--text-secondary)",
                            }}
                          >
                            {result.grade}
                          </td>

                          <td
                            className="py-3 px-4 text-xs font-mono"
                            style={{
                              color:
                                "var(--text-muted)",
                            }}
                          >
                            {result.date}
                          </td>

                          <td className="py-3 px-4">
                            <span className="badge-active px-2.5 py-0.5 rounded-full text-[10px] font-medium">
                              {result.status}
                            </span>
                          </td>
                        </tr>
                      )
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-xs"
                        style={{
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        {loading
                          ? "Loading results..."
                          : "No records found matching your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity */}
          <RecentActivity />
        </main>
      </div>
    </div>
  );
}