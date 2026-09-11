import { useEffect, useState } from "react";
import {
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaFileAlt,
  FaArrowUp,
} from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const OrganizationDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const storedUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );

        const orgId = storedUser?.orgId;

        if (!orgId) {
          throw new Error("Organization ID not found.");
        }

        const [orgResponse, membersResponse, examsResponse] =
          await Promise.all([
            api.get(`/organizations/${orgId}`),
            api.get(`/organizations/${orgId}/members`),
            api.get("/exams"),
          ]);

        setOrganization(
          orgResponse.data?.data || orgResponse.data || null
        );

        setMembers(
          membersResponse.data?.data ||
            membersResponse.data ||
            []
        );

        setExams(
          examsResponse.data?.data ||
            examsResponse.data ||
            []
        );
      } catch (err) {
        console.error("Organization dashboard error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load organization data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  /* ================= DATA ================= */

  const students = members.filter(
    (member) =>
      String(member.role || "").toUpperCase() === "STUDENT"
  );

  const examiners = members.filter(
    (member) =>
      String(member.role || "").toUpperCase() === "EXAM_CREATOR"
  );

  const proctors = members.filter(
    (member) =>
      String(member.role || "").toUpperCase() === "PROCTOR"
  );

  const activeExams = exams.filter((exam) => {
    const status = String(exam.status || "").toUpperCase();

    return (
      status === "ACTIVE" ||
      status === "ONGOING" ||
      status === "PUBLISHED"
    );
  });

  const upcomingExams = exams
    .filter((exam) => {
      const status = String(exam.status || "").toUpperCase();

      return (
        status === "UPCOMING" ||
        status === "SCHEDULED" ||
        status === "PUBLISHED"
      );
    })
    .slice(0, 4);

  const displayExams =
    upcomingExams.length > 0
      ? upcomingExams
      : exams.slice(0, 4);

  const getExamDate = (exam) => {
    const date =
      exam.startTime ||
      exam.scheduledAt ||
      exam.startDate ||
      exam.date;

    if (!date) return "Scheduled";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return String(date);
    }

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  const getExamTime = (exam) => {
    const date =
      exam.startTime ||
      exam.scheduledAt ||
      exam.startDate ||
      exam.date;

    if (!date) return "--";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }

    return parsed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getExamStudents = (exam) => {
    const count =
      exam.studentCount ??
      exam.studentsCount ??
      exam.assignedStudents ??
      exam.totalStudents;

    return count !== undefined
      ? `${count} Students`
      : "Students not assigned";
  };

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      {/* Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Organization Dashboard
            </h1>
            <p className="text-[11px] text-slate-400">
              Manage your organization and examination activities
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {organization?.name || "Organization Admin"}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Organization Admin
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Loading */}
          {loading && (
            <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-300">
              Loading organization data...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* Welcome Header */}
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Overview
            </span>

            <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Welcome back, Anchal
            </h2>

            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Here's what's happening in your organization today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={students.length.toLocaleString()}
              icon={<FaUsers size={16} />}
              change="Live"
            />

            <StatCard
              title="Examiners"
              value={examiners.length.toLocaleString()}
              icon={<FaUserTie size={16} />}
              change="Live"
            />

            <StatCard
              title="Proctors"
              value={proctors.length.toLocaleString()}
              icon={<FaUserShield size={16} />}
              change="Live"
            />

            <StatCard
              title="Active Exams"
              value={activeExams.length
                .toString()
                .padStart(2, "0")}
              icon={<FaFileAlt size={16} />}
              change="Live"
            />
          </div>

          {/* Middle Section */}
          <div className="grid lg:grid-cols-3 gap-6 mt-6">
            {/* Upcoming Exams */}
            <div className="lg:col-span-2 bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    Upcoming Exams
                  </h3>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Exams scheduled for your organization
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate("/organization/upcoming-exams")
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2.5">
                {displayExams.length > 0 ? (
                  displayExams.map((exam) => (
                    <ExamRow
                      key={exam.id}
                      title={
                        exam.title ||
                        exam.name ||
                        "Untitled Exam"
                      }
                      date={getExamDate(exam)}
                      time={getExamTime(exam)}
                      students={getExamStudents(exam)}
                    />
                  ))
                ) : (
                  <div className="p-5 text-center text-xs text-slate-500 border border-white/[0.05] rounded-lg">
                    No upcoming exams found.
                  </div>
                )}
              </div>
            </div>

            {/* Organization Overview */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Organization Overview
              </h3>

              <p className="text-xs text-slate-400 mt-0.5">
                Current operational efficiency
              </p>

              <div className="mt-5 space-y-4">
                <ProgressItem
                  title="Student Engagement"
                  value={students.length > 0 ? "82%" : "0%"}
                  width={students.length > 0 ? "82%" : "0%"}
                />

                <ProgressItem
                  title="Exam Completion"
                  value={exams.length > 0 ? "74%" : "0%"}
                  width={exams.length > 0 ? "74%" : "0%"}
                />

                <ProgressItem
                  title="Proctor Availability"
                  value={proctors.length > 0 ? "91%" : "0%"}
                  width={proctors.length > 0 ? "91%" : "0%"}
                />
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Activity */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight pb-3 mb-4 border-b border-white/[0.06]">
                Recent Activity
              </h3>

              <div className="space-y-3">
                <Activity
                  text={`${students.length} students currently registered`}
                  time="Live organization data"
                />

                <Activity
                  text={`${examiners.length} examiners in organization`}
                  time="Live organization data"
                />

                <Activity
                  text={`${proctors.length} proctors available`}
                  time="Live organization data"
                />

                <Activity
                  text={`${exams.length} exams found`}
                  time="Live examination data"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Quick Actions
              </h3>

              <p className="text-xs text-slate-400 mt-0.5 mb-4">
                Common administrative workflows
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    navigate("/organization/students")
                  }
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUsers className="text-blue-400 text-sm mb-2" />

                  <p className="font-semibold text-white text-xs">
                    Manage Students
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Enrolled candidates
                  </p>
                </button>

                <button
                  onClick={() =>
                    navigate("/organization/examiners")
                  }
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUserTie className="text-blue-400 text-sm mb-2" />

                  <p className="font-semibold text-white text-xs">
                    Manage Examiners
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Faculty paper creators
                  </p>
                </button>

                <button
                  onClick={() =>
                    navigate("/organization/proctors")
                  }
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaUserShield className="text-blue-400 text-sm mb-2" />

                  <p className="font-semibold text-white text-xs">
                    Manage Proctors
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Assign invigilators
                  </p>
                </button>

                <button
                  onClick={() =>
                    navigate("/organization/active-exams")
                  }
                  className="p-3.5 rounded-lg bg-[#090a0f] border border-white/[0.07] text-left hover:border-white/[0.15] hover:bg-white/[0.02] transition"
                >
                  <FaFileAlt className="text-blue-400 text-sm mb-2" />

                  <p className="font-semibold text-white text-xs">
                    View Exams
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Active examination grid
                  </p>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/* ================= SUBCOMPONENTS ================= */

const StatCard = ({ title, value, icon, change }) => {
  return (
    <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm hover:border-white/[0.15] transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
            {title}
          </p>

          <h3 className="text-2xl font-bold mt-2 text-white tracking-tight">
            {value}
          </h3>
        </div>

        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 text-[11px] text-emerald-400 font-medium">
        <FaArrowUp size={9} />

        {change}

        <span className="text-slate-400 ml-0.5">
          organization data
        </span>
      </div>
    </div>
  );
};

const ExamRow = ({ title, date, time, students }) => {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#090a0f] border border-white/[0.05] hover:border-white/[0.1] transition text-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <FaFileAlt size={12} />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-white truncate">
            {title}
          </p>

          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            {students}
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-medium text-white">
          {date}
        </p>

        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
          {time}
        </p>
      </div>
    </div>
  );
};

const ProgressItem = ({ title, value, width }) => {
  return (
    <div>
      <div className="flex justify-between mb-1.5 text-xs">
        <span className="text-slate-300 font-medium">
          {title}
        </span>

        <span className="font-semibold text-white font-mono">
          {value}
        </span>
      </div>

      <div className="h-1.5 bg-[#090a0f] border border-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full"
          style={{ width }}
        />
      </div>
    </div>
  );
};

const Activity = ({ text, time }) => {
  return (
    <div className="flex gap-2.5 items-start text-xs pb-2.5 border-b border-white/[0.04] last:border-none last:pb-0">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />

      <div>
        <p className="font-medium text-slate-200">
          {text}
        </p>

        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
          {time}
        </p>
      </div>
    </div>
  );
};

export default OrganizationDashboard;
