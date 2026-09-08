import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaPlus } from "react-icons/fa";

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
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      <OrganizationSidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Faculty</span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Examiners Management</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage faculty members and exam paper creators for your organization.</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit">
            <FaPlus size={11} /> Add New Examiner
          </button>
        </div>

        {/* Search & Stats */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search examiners by name, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total Examiners: <span className="font-semibold text-white">{filteredExaminers.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Examiner</th>
                  <th className="pb-3 px-3">Department</th>
                  <th className="pb-3 px-3">Active Exams</th>
                  <th className="pb-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredExaminers.length > 0 ? (
                  filteredExaminers.map((examiner) => (
                    <ExaminerRow key={examiner.id} examiner={examiner} />
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
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
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white">{examiner.name}</p>
            <p className="text-[11px] text-slate-400">{examiner.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-slate-300">{examiner.department}</td>
      <td className="py-3 px-3 text-slate-300 font-mono">{examiner.activeExams}</td>
      <td className="py-3 px-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
            examiner.status === "Active"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {examiner.status}
        </span>
      </td>
    </tr>
  );
};