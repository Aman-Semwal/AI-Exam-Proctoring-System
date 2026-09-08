import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";
import { FaSearch, FaPlus } from "react-icons/fa";

const initialProctors = [
  { id: 1, name: "Captain Vikram", email: "vikram.security@college.edu", assignedExam: "B.Tech CSE - Final Algorithm Exam", shift: "Morning", status: "Monitoring" },
  { id: 2, name: "Ayesha Khan", email: "ayesha.khan@college.edu", assignedExam: "B.Tech ECE - Microprocessors", shift: "Morning", status: "Idle" },
  { id: 3, name: "Rohan Verma", email: "rohan.verma@college.edu", assignedExam: "B.Tech IT - DBMS Mid-Term", shift: "Evening", status: "Offline" },
  { id: 4, name: "Simran Kaur", email: "simran.kaur@college.edu", assignedExam: "B.Tech CSE - Data Structures", shift: "Morning", status: "Monitoring" },
];

export default function Proctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [proctors] = useState(initialProctors);

  const filteredProctors = proctors.filter(
    (proctor) =>
      proctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proctor.assignedExam.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-base font-semibold text-white tracking-tight">Proctors Management</h1>
            <p className="text-[11px] text-slate-400">
              Monitor invigilators and assigned exam duties in real-time.
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
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Invigilators</span>
              <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">All Proctors</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">Manage proctor shifts and live surveillance status seamlessly.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit">
              <FaPlus size={11} /> Assign Proctor
            </button>
          </div>

          {/* Search & Stats */}
          <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                <input
                  type="text"
                  placeholder="Search proctors by name, email, or assigned exam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Total Proctors: <span className="font-semibold text-white">{filteredProctors.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Proctor</th>
                    <th className="pb-3 px-3">Assigned Exam</th>
                    <th className="pb-3 px-3">Shift</th>
                    <th className="pb-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-xs">
                  {filteredProctors.length > 0 ? (
                    filteredProctors.map((proctor) => (
                      <ProctorRow key={proctor.id} proctor={proctor} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
                        No proctors found matching your search.
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

const ProctorRow = ({ proctor }) => {
  const initials = proctor.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const getStatusBadge = (status) => {
    switch (status) {
      case "Monitoring":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Idle":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Offline":
      default:
        return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <tr className="hover:bg-white/[0.02] transition">
      <td className="py-3 px-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-white">{proctor.name}</p>
            <p className="text-[11px] text-slate-400">{proctor.email}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-slate-300">{proctor.assignedExam}</td>
      <td className="py-3 px-3 text-slate-300">{proctor.shift}</td>
      <td className="py-3 px-3">
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusBadge(proctor.status)}`}>
          {proctor.status}
        </span>
      </td>
    </tr>
  );
};