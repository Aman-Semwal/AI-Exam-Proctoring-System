import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch } from "react-icons/fa";

const initialActiveExams = [
  { id: 1, title: "B.Tech CSE - Final Algorithm Exam", course: "CS401", studentsLive: 120, proctor: "Captain Vikram", duration: "2 Hours", startTime: "10:00 AM" },
  { id: 2, title: "B.Tech ECE - Microprocessors Mid-Term", course: "EC302", studentsLive: 85, proctor: "Ayesha Khan", duration: "1.5 Hours", startTime: "10:30 AM" },
  { id: 3, title: "B.Tech IT - DBMS Advanced Test", course: "IT505", studentsLive: 95, proctor: "Simran Kaur", duration: "2 Hours", startTime: "11:00 AM" },
];

export default function ActiveExams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exams] = useState(initialActiveExams);

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.proctor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#090a0f] text-slate-100">
      {/* Organization Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#090a0f]/80 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div>
            <h1 className="text-base font-semibold text-white tracking-tight">Active Exams Monitoring</h1>
            <p className="text-[11px] text-slate-400">
              Track and supervise currently running examinations across departments.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
              AS
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">Anchal Saini</p>
              <p className="text-[10px] text-slate-400 leading-tight">Organization Admin</p>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Live Streams</span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Currently Running Exams</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Real-time candidate monitoring and active assessment telemetry.</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Sessions Active
            </div>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search active exams by title, course, or proctor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Live Exams: <span className="font-semibold text-white">{filteredExams.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Exam Details</th>
                    <th className="pb-3 px-3">Live Candidates</th>
                    <th className="pb-3 px-3">Assigned Proctor</th>
                    <th className="pb-3 px-3">Start Time / Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredExams.length > 0 ? (
                    filteredExams.map((exam) => (
                      <ActiveExamRow key={exam.id} exam={exam} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
                        No active exams found matching your search.
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
}

const ActiveExamRow = ({ exam }) => {
  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div>
          <p className="font-semibold text-white">{exam.title}</p>
          <span className="inline-block font-mono text-[11px] text-blue-400 mt-0.5">
            {exam.course}
          </span>
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1.5 font-mono text-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>{exam.studentsLive} students</span>
        </div>
      </td>
      <td className="py-3 px-3 text-slate-300">{exam.proctor}</td>
      <td className="py-3 px-3">
        <p className="font-medium text-white">{exam.startTime}</p>
        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{exam.duration}</p>
      </td>
    </tr>
  );
};