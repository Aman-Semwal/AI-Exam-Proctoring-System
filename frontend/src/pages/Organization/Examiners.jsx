import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

const initialExaminers = [
  { id: 1, name: "Dr. Alok Kumar", email: "alok.kumar@college.edu", department: "Computer Science", activeExams: 2, status: "Active" },
  { id: 2, name: "Prof. Sunita Rao", email: "sunita.rao@college.edu", department: "Electronics", activeExams: 1, status: "Active" },
  { id: 3, name: "Dr. Rajesh Sharma", email: "rajesh.sharma@college.edu", department: "Information Tech", activeExams: 0, status: "On Leave" },
  { id: 4, name: "Dr. Meenakshi Iyer", email: "meenakshi.iyer@college.edu", department: "Computer Science", activeExams: 3, status: "Active" },
];

export default function Examiners() {
  const [searchQuery, setSearchQuery] = useState("");
  const [examiners] = useState(initialExaminers);

  const filteredExaminers = examiners.filter(
    (examiner) =>
      examiner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      examiner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      examiner.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white flex">
      {/* Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Examiners Management</h1>
              <p className="text-sm text-slate-400">Manage faculty members and exam creators for your organization.</p>
            </div>
            <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-xl font-semibold transition shadow-md">
              + Add New Examiner
            </button>
          </div>

          {/* Search & Stats */}
          <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search examiners by name, email, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="text-sm text-slate-400 hidden md:block">
              Total Examiners: <span className="font-semibold text-white">{filteredExaminers.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Examiner</th>
                  <th className="py-3 px-6">Department</th>
                  <th className="py-3 px-6">Active Exams</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredExaminers.length > 0 ? (
                  filteredExaminers.map((examiner) => (
                    <ExaminerRow key={examiner.id} examiner={examiner} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                      No examiners found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

const ExaminerRow = ({ examiner }) => {
  const initials = examiner.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <tr className="hover:bg-slate-800/50 transition">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-medium text-white">{examiner.name}</p>
            <p className="text-xs text-slate-400">{examiner.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-slate-300">{examiner.department}</td>
      <td className="py-4 px-6 text-sm text-slate-300 font-medium">{examiner.activeExams}</td>
      <td className="py-4 px-6">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            examiner.status === "Active"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
          }`}
        >
          {examiner.status}
        </span>
      </td>
    </tr>
  );
};