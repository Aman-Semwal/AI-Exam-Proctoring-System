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
    <div className="min-h-screen bg-[#020617] text-white flex">
      
      {/* Sidebar for Examiner Section */}
      <aside className="w-72 min-h-screen bg-slate-900 border-r border-white/10 flex flex-col justify-between p-6">
        <div>
          <div className="mb-8 cursor-pointer" onClick={() => navigate("/examiner/dashboard")}>
            <h1 className="text-2xl font-bold text-white">
              Examiner<span className="text-cyan-400">Portal</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Exam Creation & Monitoring</p>
          </div>

          <nav className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm shadow-md">
              <FaClipboardList />
              My Exams
            </div>
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white py-2.5 rounded-xl transition text-sm font-medium border border-rose-500/20"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Examiner Dashboard</h1>
              <p className="text-sm text-slate-400">Create, manage, and monitor your exam papers and student submissions.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold transition shadow-md flex items-center gap-2"
            >
              <FaPlus /> Create New Exam
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <FaClipboardList className="text-cyan-400" /> Total Exams Created
              </p>
              <p className="text-3xl font-bold text-white mt-2">{exams.length}</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <FaCheckCircle className="text-emerald-400" /> Published / Active
              </p>
              <p className="text-3xl font-bold text-emerald-400 mt-2">
                {exams.filter(e => e.status === "Published").length}
              </p>
            </div>
            <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-white/10">
              <p className="text-sm text-slate-400 font-medium flex items-center gap-2">
                <FaFileAlt className="text-amber-400" /> Drafts
              </p>
              <p className="text-3xl font-bold text-amber-400 mt-2">
                {exams.filter(e => e.status === "Draft").length}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-white/10 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 w-full md:w-96">
              <FaSearch className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Search your exams by title or course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <div className="text-sm text-slate-400 hidden md:block">
              Showing: <span className="font-semibold text-white">{filteredExams.length} exams</span>
            </div>
          </div>

          {/* Exams Table */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-white/10 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Exam Title</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Registered Students</th>
                  <th className="py-3 px-6">Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredExams.length > 0 ? (
                  filteredExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-4 px-6">
                        <p className="font-medium text-white">{exam.title}</p>
                        <span className="inline-block bg-slate-800 text-cyan-400 border border-white/10 text-xs px-2 py-0.5 rounded font-mono mt-1">
                          {exam.course}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            exam.status === "Published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {exam.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-200">
                        {exam.registered} students
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">{exam.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500 text-sm">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Create New Exam</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleCreateExamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g., Computer Networks Mid-Term"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Course Code</label>
                <input
                  type="text"
                  placeholder="e.g., CS302"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Scheduled Date</label>
                <input
                  type="text"
                  placeholder="e.g., 25 Aug 2026"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-semibold transition"
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