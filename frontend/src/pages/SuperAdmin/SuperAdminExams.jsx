import { useEffect, useMemo, useState } from "react";
import SuperAdminSidebar from "../../components/superadmin/SuperAdminSidebar";
import SuperAdminTopbar from "../../components/superadmin/SuperAdminTopbar";
import { FaFileAlt, FaSearch, FaEllipsisV, FaRedo } from "react-icons/fa";
import api from "../../services/api";

const SuperAdminExams = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getList = (response) => {
    const data = response?.data?.data ?? response?.data;

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.exams)) return data.exams;

    return [];
  };

  const formatDuration = (duration) => {
    if (duration === null || duration === undefined || duration === "") {
      return "—";
    }

    const value = Number(duration);

    if (Number.isNaN(value)) {
      return String(duration);
    }

    return `${value} mins`;
  };

  const getStatus = (exam) => {
    const rawStatus = String(exam?.status || "").toUpperCase();

    if (
      rawStatus === "ACTIVE" ||
      rawStatus === "ONGOING" ||
      rawStatus === "LIVE" ||
      rawStatus === "IN_PROGRESS"
    ) {
      return "Live";
    }

    if (
      rawStatus === "COMPLETED" ||
      rawStatus === "FINISHED" ||
      rawStatus === "CLOSED"
    ) {
      return "Completed";
    }

    if (
      rawStatus === "CANCELLED" ||
      rawStatus === "CANCELED"
    ) {
      return "Cancelled";
    }

    return "Scheduled";
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/exams");
      const examList = getList(response);

      setExams(examList);
    } catch (err) {
      console.error("Failed to fetch exams:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load examinations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const normalizedExams = useMemo(() => {
    return exams.map((exam) => ({
      id: exam.id,
      title:
        exam.title ||
        exam.name ||
        exam.examTitle ||
        "Untitled Exam",

      code:
        exam.code ||
        exam.examCode ||
        exam.courseCode ||
        "—",

      org:
        exam.organizationName ||
        exam.orgName ||
        exam.organization?.name ||
        exam.org?.name ||
        exam.orgSlug ||
        "—",

      duration: formatDuration(
        exam.durationMinutes ??
          exam.duration ??
          exam.durationInMinutes
      ),

      status: getStatus(exam),
    }));
  }, [exams]);

  const filtered = normalizedExams.filter(
    (exam) =>
      exam.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      exam.code
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      exam.org
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <SuperAdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <SuperAdminTopbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              Examinations
            </span>

            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Platform Examinations
            </h1>

            <p className="text-slate-400 mt-1 text-xs sm:text-sm">
              Oversee all active, scheduled, and completed assessments across
              organizations.
            </p>
          </div>

          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search exams by title, code or org..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-mono">
                  Total: {filtered.length} Examinations
                </span>

                <button
                  onClick={fetchExams}
                  disabled={loading}
                  className="p-2 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05] transition disabled:opacity-50"
                  title="Refresh"
                >
                  <FaRedo
                    size={11}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">
                  Loading examinations...
                </p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-rose-400 mb-4">
                  {error}
                </p>

                <button
                  onClick={fetchExams}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition"
                >
                  Retry
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <FaFileAlt
                  className="mx-auto text-slate-600 mb-3"
                  size={24}
                />

                <p className="text-sm text-slate-400">
                  {searchTerm
                    ? "No examinations match your search."
                    : "No examinations found."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[750px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-3">
                        Exam Title
                      </th>

                      <th className="pb-3 px-3">
                        Code
                      </th>

                      <th className="pb-3 px-3">
                        Organization
                      </th>

                      <th className="pb-3 px-3">
                        Duration
                      </th>

                      <th className="pb-3 px-3">
                        Status
                      </th>

                      <th className="pb-3 px-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filtered.map((exam) => (
                      <tr
                        key={exam.id}
                        className="hover:bg-white/[0.02] transition"
                      >
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-xs">
                              <FaFileAlt size={11} />
                            </div>

                            <span>
                              {exam.title}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-purple-400">
                          {exam.code}
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          {exam.org}
                        </td>

                        <td className="py-3 px-3 text-slate-400 font-mono">
                          {exam.duration}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              exam.status === "Live"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : exam.status === "Scheduled"
                                ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                : exam.status === "Cancelled"
                                ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {exam.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            className="p-1.5 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white transition"
                            title="More actions"
                          >
                            <FaEllipsisV size={11} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminExams;