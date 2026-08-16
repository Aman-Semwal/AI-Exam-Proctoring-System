import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

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
    <div className="flex min-h-screen bg-[#020617] text-white">
      
      {/* Organization Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Active Exams Monitoring</h1>
            <p className="text-sm text-slate-400 mt-1">
              Track and supervise currently running examinations across departments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              AS
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-white">Anchal Saini</p>
              <p className="text-xs text-slate-400">Organization Admin</p>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="p-6 lg:p-10 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            
            {/* Page Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-cyan-400 font-medium">Organization Admin</p>
                <h2 className="text-3xl font-bold text-white mt-1">Live Exams</h2>
                <p className="text-slate-400 mt-2">Real-time student monitoring and exam statuses.</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/20 text-sm font-medium shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Sessions Active
              </div>
            </div>

            {/* Search & Stats */}
            <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search active exams by title, course, or proctor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <div className="text-sm text-slate-400">
                Total Live Exams: <span className="font-semibold text-white">{filteredExams.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Exam Details</th>
                      <th className="py-3 px-6">Live Students</th>
                      <th className="py-3 px-6">Assigned Proctor</th>
                      <th className="py-3 px-6">Start Time / Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <ActiveExamRow key={exam.id} exam={exam} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                          No active exams found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}

const ActiveExamRow = ({ exam }) => {
  return (
    <tr className="hover:bg-slate-800/50 transition">
      <td className="py-4 px-6">
        <div>
          <p className="font-medium text-white">{exam.title}</p>
          <span className="inline-block bg-slate-800 text-cyan-400 border border-white/10 text-xs px-2 py-0.5 rounded font-mono mt-1">
            {exam.course}
          </span>
        </div>
      </td>
      <td className="py-4 px-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-sm font-semibold text-slate-200">{exam.studentsLive} students</span>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-slate-300">{exam.proctor}</td>
      <td className="py-4 px-6">
        <p className="text-sm font-medium text-white">{exam.startTime}</p>
        <p className="text-xs text-slate-400">{exam.duration}</p>
      </td>
    </tr>
  );
};