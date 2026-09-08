import { useState } from "react";
import { FaClipboardList, FaPlus, FaSearch, FaCheckCircle, FaFileAlt, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const initialMyExams = [
  { id: 1, title: "B.Tech CSE - Final Algorithm Exam", course: "CS401", status: "Published", registered: 120, date: "20 Aug 2026" },
  { id: 2, title: "B.Tech CSE - Data Structures Mid-Term", course: "CS201", status: "Draft", registered: 0, date: "Pending" },
  { id: 3, title: "B.Tech AI - Machine Learning Quiz", course: "AI501", status: "Published", registered: 95, date: "22 Aug 2026" },
];

export default function ExaminerDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [exams, setExams] = useState(initialMyExams);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDate, setNewDate] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/");
  };

  const handleCreateExamSubmit = (e) => {
    e.preventDefault();
    if (!newTitle || !newCourse) return;

    const newExamEntry = {
      id: exams.length + 1,
      title: newTitle,
      course: newCourse,
      status: "Draft",
      registered: 0,
      date: newDate || "Pending",
    };

    setExams([newExamEntry, ...exams]);
    setNewTitle("");
    setNewCourse("");
    setNewDate("");
    setIsModalOpen(false);
  };

  const filteredExams = exams.filter(
    (exam) =>
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* Sidebar for Examiner Section */}
      <aside className="w-64 min-h-screen bg-[#0d0f17] border-r border-white/[0.07] flex flex-col justify-between p-4 shrink-0 sticky top-0 h-screen">
        <div>
          <div className="p-3 mb-4 cursor-pointer flex items-center gap-3 group" onClick={() => navigate("/examiner/dashboard")}>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaClipboardList size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Examiner<span className="text-blue-400">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Faculty Authoring</p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
              Workspace
            </p>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold text-xs shadow-sm">
              <FaClipboardList size={14} />
              <span>My Exams</span>
            </div>
          </nav>
        </div>

        <div className="pt-3 border-t border-white/[0.07]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-2 rounded-lg transition"
          >
            <FaSignOutAlt size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Faculty Portal</span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">Examiner Dashboard</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">Create, manage, and monitor your exam papers and student submissions.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm active:scale-[0.98] flex items-center gap-1.5 w-fit"
          >
            <FaPlus size={11} /> Create New Exam
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
              <FaClipboardList className="text-blue-400" /> Total Exams Created
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">{exams.length}</p>
          </div>
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
              <FaCheckCircle className="text-emerald-400" /> Published / Active
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2 font-mono">
              {exams.filter(e => e.status === "Published").length}
            </p>
          </div>
          <div className="bg-[#121520] p-5 rounded-xl border border-white/[0.07] shadow-sm">
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 uppercase tracking-wider">
              <FaFileAlt className="text-amber-400" /> Drafts
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono">
              {exams.filter(e => e.status === "Draft").length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center bg-[#090a0f] border border-white/[0.08] rounded-lg px-3 py-2 w-full sm:w-80">
              <FaSearch className="text-slate-500 text-xs mr-2.5" />
              <input
                type="text"
                placeholder="Search your exams by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing: <span className="font-semibold text-white">{filteredExams.length} exams</span>
            </div>
          </div>

          {/* Exams Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[650px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Exam Title</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Registered Candidates</th>
                  <th className="pb-3 px-3">Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-white">{exam.title}</p>
                        <span className="inline-block text-blue-400 font-mono text-[11px] mt-0.5">
                          {exam.course}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                            exam.status === "Published"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono">
                        {exam.registered} candidates
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono">{exam.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-xs">
                      No exams found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create New Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-white tracking-tight">Create New Exam Paper</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <FaTimes size={14} />
              </button>
            </div>
            
            <form onSubmit={handleCreateExamSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Networks Mid-Term"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g., CS302"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-300 mb-1">Scheduled Date</label>
                <input
                  type="text"
                  placeholder="e.g., 25 Aug 2026"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#090a0f] hover:bg-white/[0.04] text-slate-300 rounded-lg font-medium border border-white/[0.08] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition active:scale-[0.98] shadow-sm"
                >
                  Create Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}