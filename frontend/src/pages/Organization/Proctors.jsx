import { useState } from "react";
import OrganizationSidebar from "../../components/layout/OrganizationSidebar";

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
    <div className="flex min-h-screen bg-[#020617] text-white">
      
      {/* Organization Sidebar */}
      <OrganizationSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="h-20 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 lg:px-10">
          <div>
            <h1 className="text-2xl font-bold text-white">Proctors Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Monitor invigilators and assigned exam duties in real-time.
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
                <h2 className="text-3xl font-bold text-white mt-1">All Proctors</h2>
                <p className="text-slate-400 mt-2">Manage proctor shifts and live status seamlessly.</p>
              </div>
              <button className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-3 rounded-xl font-semibold transition shadow-md flex items-center justify-center gap-2">
                + Assign Proctor
              </button>
            </div>

            {/* Search & Stats */}
            <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <input
                type="text"
                placeholder="Search proctors by name, email, or assigned exam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96 px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <div className="text-sm text-slate-400">
                Total Proctors: <span className="font-semibold text-white">{filteredProctors.length}</span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Proctor</th>
                      <th className="py-3 px-6">Assigned Exam</th>
                      <th className="py-3 px-6">Shift</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredProctors.length > 0 ? (
                      filteredProctors.map((proctor) => (
                        <ProctorRow key={proctor.id} proctor={proctor} />
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
                          No proctors found matching your search.
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
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Idle":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Offline":
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  return (
    <tr className="hover:bg-slate-800/50 transition">
      <td className="py-4 px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-semibold text-sm">
            {initials}
          </div>
          <div>
            <p className="font-medium text-white">{proctor.name}</p>
            <p className="text-xs text-slate-400">{proctor.email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-slate-300">{proctor.assignedExam}</td>
      <td className="py-4 px-6 text-sm text-slate-300">{proctor.shift}</td>
      <td className="py-4 px-6">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(proctor.status)}`}>
          {proctor.status}
        </span>
      </td>
    </tr>
  );
};