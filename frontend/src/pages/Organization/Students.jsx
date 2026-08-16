import { useState } from "react";
import { FaSearch, FaPlus, FaEllipsisV,  } from "react-icons/fa";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

const studentsData = [
  {
    name: "Anchal Saini",
    email: "anchal.saini@mmu.edu",
    batch: "CS-3A",
    exams: 8,
    status: "Active",
  },
  {
    name: "Rahul Verma",
    email: "rahul.verma@mmu.edu",
    batch: "CS-3A",
    exams: 6,
    status: "Active",
  },
  {
    name: "Priya Singh",
    email: "priya.singh@mmu.edu",
    batch: "CS-2B",
    exams: 5,
    status: "Active",
  },
  {
    name: "Amit Rana",
    email: "amit.rana@mmu.edu",
    batch: "CS-2B",
    exams: 3,
    status: "Inactive",
  },
  {
    name: "Sneha Rao",
    email: "sneha.rao@mmu.edu",
    batch: "CS-3A",
    exams: 7,
    status: "Active",
  },
  {
    name: "Karan Mehta",
    email: "karan.mehta@mmu.edu",
    batch: "CS-1A",
    exams: 2,
    status: "Active",
  },
];

const Students = () => {
  const [search, setSearch] = useState("");

  const filteredStudents = studentsData.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.email.toLowerCase().includes(search.toLowerCase())
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
            <h1 className="text-2xl font-bold text-white">Students</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage students in your organization
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

          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <p className="text-cyan-400 font-medium">Organization Admin</p>
              <h2 className="text-3xl font-bold text-white mt-1">All Students</h2>
              <p className="text-slate-400 mt-2">
                View and manage students enrolled in your organization.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold px-5 py-3 rounded-xl transition shadow-md">
              <FaPlus />
              Add Student
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl px-4 py-3 w-full md:w-96 shadow-sm">
              <FaSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ml-3 w-full bg-transparent outline-none text-white placeholder-slate-400 text-sm"
              />
            </div>

            <p className="text-sm text-slate-400">
              Showing {filteredStudents.length} of {studentsData.length} students
            </p>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4">Student</th>
                    <th className="pb-4">Batch</th>
                    <th className="pb-4">Exams Given</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {filteredStudents.map((student, index) => (
                    <StudentRow key={index} student={student} />
                  ))}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-10 text-center text-slate-500">
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


/* ================= STUDENT ROW ================= */

const StudentRow = ({ student }) => {
  const initials = student.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <tr className="border-b border-white/10 hover:bg-slate-800/50 transition">
      {/* Student */}
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-medium text-white">{student.name}</p>
            <p className="text-xs text-slate-400">{student.email}</p>
          </div>
        </div>
      </td>

      {/* Batch */}
      <td className="py-4 text-sm text-slate-300">{student.batch}</td>

      {/* Exams */}
      <td className="py-4 text-sm text-slate-300">{student.exams}</td>

      {/* Status */}
      <td className="py-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.status === "Active"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-slate-800 text-slate-400 border border-slate-700"
          }`}
        >
          {student.status}
        </span>
      </td>

      {/* Actions */}
      <td className="py-4 text-right">
        <button className="text-slate-400 hover:text-cyan-400 p-2 transition">
          <FaEllipsisV />
        </button>
      </td>
    </tr>
  );
};

export default Students;