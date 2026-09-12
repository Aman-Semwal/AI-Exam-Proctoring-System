import { useEffect, useMemo, useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaPlus } from "react-icons/fa";
import api from "../../services/api";

export default function UpcomingExams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUpcomingExams = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/exams");

      const data = response.data?.data;
      const examList = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : Array.isArray(response.data)
        ? response.data
        : [];

      setExams(examList);
    } catch (err) {
      console.error("Failed to load upcoming exams:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load upcoming exams. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUpcomingExams();
  }, []);

  const upcomingExams = useMemo(() => {
    const now = new Date();

    return exams
      .filter((exam) => {
        const status = String(exam.status || "").toUpperCase();

        if (["COMPLETED", "CANCELLED", "CANCELED"].includes(status)) {
          return false;
        }

        const examDate = exam.startTime || exam.startDate || exam.date;

        if (examDate) {
          const parsedDate = new Date(examDate);

          if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate >= now;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(
          a.startTime || a.startDate || a.date || 0
        ).getTime();

        const dateB = new Date(
          b.startTime || b.startDate || b.date || 0
        ).getTime();

        return dateA - dateB;
      });
  }, [exams]);

  const filteredExams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return upcomingExams;

    return upcomingExams.filter((exam) => {
      const title = String(
        exam.title || exam.name || exam.examTitle || ""
      ).toLowerCase();

      const course = String(
        exam.course || exam.courseCode || exam.subject || ""
      ).toLowerCase();

      const examiner = String(
        exam.assignedExaminer ||
          exam.examinerName ||
          exam.createdByName ||
          exam.examiner ||
          ""
      ).toLowerCase();

      return (
        title.includes(query) ||
        course.includes(query) ||
        examiner.includes(query)
      );
    });
  }, [upcomingExams, searchQuery]);

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      <OrganizationSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">
              Upcoming Exams Schedule
            </h1>
            <p className="text-[11px] text-slate-400">
              Plan, review, and organize upcoming academic assessments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              AS
            </div>

            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">
                Organization Admin
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Organization Admin
              </p>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Timetable
              </span>

              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
                Scheduled Assessments
              </h2>

              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Manage examination timetables and registered candidates.
              </p>
            </div>

            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
            >
              <FaPlus size={11} />
              Schedule New Exam
            </button>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />

                <input
                  type="text"
                  placeholder="Search upcoming exams by title, course, or examiner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total Scheduled:{" "}
                <span className="font-semibold text-white">
                  {filteredExams.length}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                <span>{error}</span>

                <button
                  type="button"
                  onClick={loadUpcomingExams}
                  className="px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading upcoming exams...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Exam Details</th>
                      <th className="pb-3 px-3">Date & Time</th>
                      <th className="pb-3 px-3">Assigned Examiner</th>
                      <th className="pb-3 px-3">Registered Students</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <UpcomingExamRow key={exam.id} exam={exam} />
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          No upcoming exams found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

const UpcomingExamRow = ({ exam }) => {
  const title =
    exam.title || exam.name || exam.examTitle || "Untitled Exam";

  const course =
    exam.course || exam.courseCode || exam.subject || "N/A";

  const examiner =
    exam.assignedExaminer ||
    exam.examinerName ||
    exam.createdByName ||
    exam.examiner ||
    "Not Assigned";

  const registeredStudents =
    exam.totalRegistered ??
    exam.totalStudents ??
    exam.registeredStudents ??
    exam.studentCount ??
    0;

  const rawDate = exam.startTime || exam.startDate || exam.date;

  const parsedDate = rawDate ? new Date(rawDate) : null;

  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime());

  const formattedDate = validDate
    ? parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : exam.date || "Date not set";

  const formattedTime = validDate
    ? parsedDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : exam.time || "Time not set";

  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div>
          <p className="font-semibold text-white">{title}</p>

          <span className="inline-block font-mono text-[11px] text-blue-400 mt-0.5">
            {course}
          </span>
        </div>
      </td>

      <td className="py-3 px-3">
        <p className="font-medium text-white">{formattedDate}</p>

        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
          {formattedTime}
        </p>
      </td>

      <td className="py-3 px-3 text-slate-300">
        {examiner}
      </td>

      <td className="py-3 px-3 text-slate-300 font-mono">
        {registeredStudents} candidates
      </td>
    </tr>
  );
};