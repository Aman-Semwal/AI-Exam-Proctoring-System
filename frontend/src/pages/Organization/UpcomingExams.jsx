import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

const initialUpcomingExams = [
  { id: 1, title: "B.Tech CSE - Artificial Intelligence Final", course: "CS601", date: "20 Aug 2026", time: "09:00 AM", assignedExaminer: "Dr. Alok Kumar", totalRegistered: 140 },
  { id: 2, title: "B.Tech ECE - Digital Signal Processing", course: "EC403", date: "22 Aug 2026", time: "02:00 PM", assignedExaminer: "Prof. Sunita Rao", totalRegistered: 110 },
  { id: 3, title: "B.Tech IT - Cloud Computing Mid-Term", course: "IT602", date: "25 Aug 2026", time: "10:30 AM", assignedExaminer: "Dr. Meenakshi Iyer", totalRegistered: 125 },
];

export default function UpcomingExams() {
  const [searchQuery, setSearchQuery] = useState("");
  const [exams] = useState(initialUpcomingExams);

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.assignedExaminer.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-2xl font-bold text-white">Upcoming Exams Schedule</h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan, review, and organize upcoming academic assessments.
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
                <h2 className="text-3xl font-bold text-white mt-1">Scheduled Exams</h2>
                <p className="text-slate-400 mt-2">Manage examination timetables and registered candidates.</p>
              </div>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-3 rounded-xl font-semibold transition shadow-md flex items-center justify-center gap-2">
                + Schedule New Exam
              </button>
            </div>

            {/* Search & Stats */}
            <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search upcoming exams by title, course, or examiner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <div className="text-sm text-slate-400">
                Total Scheduled: <span className="font-semibold text-white">{filteredExams.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Exam Details</th>
                      <th className="py-3 px-6">Date & Time</th>
                      <th className="py-3 px-6">Assigned Examiner</th>
                      <th className="py-3 px-6">Registered Students</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredExams.length > 0 ? (
                      filteredExams.map((exam) => (
                        <UpcomingExamRow key={exam.id} exam={exam} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                          No upcoming exams found matching your search.
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

const UpcomingExamRow = ({ exam }) => {
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
        <p className="text-sm font-medium text-white">{exam.date}</p>
        <p className="text-xs text-slate-400">{exam.time}</p>
      </td>
      <td className="py-4 px-6 text-sm text-slate-300">{exam.assignedExaminer}</td>
      <td className="py-4 px-6 text-sm font-semibold text-white">
        {exam.totalRegistered} students
      </td>
    </tr>
  );
};