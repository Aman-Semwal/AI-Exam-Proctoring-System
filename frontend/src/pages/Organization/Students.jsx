import { useState } from "react";
import { FaSearch, FaPlus, FaEllipsisV } from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

const studentsData = [
  { name: "Anchal Saini", email: "anchal.saini@mmu.edu", batch: "CS-3A", exams: 8, status: "Active" },
  { name: "Rahul Verma", email: "rahul.verma@mmu.edu", batch: "CS-3A", exams: 6, status: "Active" },
  { name: "Priya Singh", email: "priya.singh@mmu.edu", batch: "CS-2B", exams: 5, status: "Active" },
  { name: "Amit Rana", email: "amit.rana@mmu.edu", batch: "CS-2B", exams: 3, status: "Inactive" },
  { name: "Sneha Rao", email: "sneha.rao@mmu.edu", batch: "CS-3A", exams: 7, status: "Active" },
  { name: "Karan Mehta", email: "karan.mehta@mmu.edu", batch: "CS-1A", exams: 2, status: "Active" },
];

const Students = () => {
  const [search, setSearch] = useState("");

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="text-base font-semibold text-white tracking-tight">Students Management</h1>
            <p className="text-[11px] text-slate-400">
              Manage students in your organization
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
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Administration</span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">All Enrolled Students</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                View and manage students enrolled in your organization.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-lg transition-all text-xs shadow-sm active:scale-[0.98] w-fit">
              <FaPlus size={11} />
              Add Student
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <p className="text-xs text-slate-400 font-mono">
                Showing {filteredStudents.length} of {studentsData.length} students
              </p>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Student</th>
                    <th className="pb-3 px-3">Batch</th>
                    <th className="pb-3 px-3">Exams Given</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredStudents.map((student, index) => (
                    <StudentRow key={index} student={student} />
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No students found matching "{search}"
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

const StudentRow = ({ student }) => {
  const initials = student.name
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
            <p className="font-semibold text-white">{student.name}</p>
            <p className="text-[11px] text-slate-400">{student.email}</p>
          </div>
        </div>
      </td>

      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">{student.batch}</td>
      <td className="py-3 px-3 text-slate-300 font-mono">{student.exams}</td>

      <td className="py-3 px-3">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
            student.status === "Active"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {student.status}
        </span>
      </td>

      <td className="py-3 px-3 text-right">
        <button className="text-slate-400 hover:text-white p-1.5 transition">
          <FaEllipsisV size={11} />
        </button>
      </td>
    </tr>
  );
};

export default Students;