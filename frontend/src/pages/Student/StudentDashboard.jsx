import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import StatCard from "../../components/common/StatCard";
import ExamCard from "../../components/common/ExamCard";
import ResultCard from "../../components/common/ResultCard";
import AlertCard from "../../components/common/AlertCard";
import ProfileCard from "../../components/common/ProfileCard";
import NotificationCard from "../../components/common/NotificationCard";

import PerformanceChart from "../../components/charts/PerformanceChart";
import CircularProgress from "../../components/dashboard/CircularProgress";
import AIStatusCard from "../../components/dashboard/AIStatusCard";
import CalendarWidget from "../../components/dashboard/CalendarWidget";
import RecentActivity from "../../components/dashboard/RecentActivity";
import AnalyticsCard from "../../components/dashboard/AnalyticsCard";

const initialResults = [
  { id: 1, exam: "B.Tech CSE - Data Structures", score: "88/100", grade: "A+", status: "Passed", date: "10 Aug 2026" },
  { id: 2, exam: "B.Tech CSE - Operating Systems", score: "76/100", grade: "B+", status: "Passed", date: "02 Aug 2026" },
  { id: 3, exam: "B.Tech CSE - Computer Networks", score: "64/100", grade: "C+", status: "Passed", date: "25 Jul 2026" },
];

export default function StudentDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results] = useState(initialResults);

  const filteredResults = results.filter(
    (item) =>
      item.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.grade.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-[#020617] min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Topbar />

        <div className="p-8 space-y-12 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Good Morning, Priya 👋
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                Welcome to your student portal. Check your upcoming assessments and performance.
              </p>
            </div>
            <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm">
              Take Active Exam
            </button>
          </div>

          {/* Quick Statistics Grid */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            <StatCard title="Total Exams" value="12" color="text-cyan-400" />
            <StatCard title="Completed" value="8" color="text-green-400" />
            <StatCard title="Upcoming" value="4" color="text-yellow-400" />
            <StatCard title="Average Score" value="91%" color="text-purple-400" />
          </div>

          {/* Analytics Overview */}
          <AnalyticsCard />

          {/* Performance Chart + Circular Progress */}
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <CircularProgress percentage={91} />
          </div>

          {/* AI Status + Calendar Widget */}
          <div className="grid lg:grid-cols-2 gap-8">
            <AIStatusCard />
            <CalendarWidget />
          </div>

          {/* Upcoming Exams + Results */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Upcoming Exams
              </h2>
              <div className="space-y-5">
                <ExamCard
                  subject="Artificial Intelligence"
                  date="20 Aug 2026"
                  time="09:00 AM"
                  status="Upcoming"
                />
                <ExamCard
                  subject="Database Management System"
                  date="25 Aug 2026"
                  time="10:30 AM"
                  status="Upcoming"
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                Recent Results
              </h2>
              <div className="space-y-4">
                <ResultCard
                  subject="Operating System"
                  marks="92%"
                  grade="A"
                  status="Passed"
                />
                <ResultCard
                  subject="Computer Networks"
                  marks="88%"
                  grade="B+"
                  status="Passed"
                />
                <ResultCard
                  subject="Software Engineering"
                  marks="95%"
                  grade="A+"
                  status="Passed"
                />
              </div>
            </div>
          </div>

          {/* Search Bar for Detailed Results Table */}
          <div className="pt-6 border-t border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-white">
                Detailed Result Archives
              </h2>
              <div className="text-sm text-slate-400">
                Recorded Results: <span className="font-semibold text-white">{filteredResults.length}</span>
              </div>
            </div>

            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
              <input
                type="text"
                placeholder="Search archives by exam name or grade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-96 px-4 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Results Table */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Examination</th>
                    <th className="py-3 px-6">Score</th>
                    <th className="py-3 px-6">Grade</th>
                    <th className="py-3 px-6">Completion Date</th>
                    <th className="py-3 px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-4 px-6 font-medium text-white">{item.exam}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-cyan-400">{item.score}</td>
                        <td className="py-4 px-6 text-sm text-slate-300 font-medium">{item.grade}</td>
                        <td className="py-4 px-6 text-sm text-slate-400">{item.date}</td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                        No results found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Alerts + Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">
                AI Alerts & Security
              </h2>
              <div className="space-y-5">
                <AlertCard
                  title="Face Detection"
                  message="Face verified successfully for ongoing check."
                  type="Info"
                />
                <AlertCard
                  title="Exam Reminder"
                  message="AI Exam starts in 3 days. Ensure setup is ready."
                  type="Warning"
                />
              </div>
            </div>
            <RecentActivity />
          </div>

          {/* Profile + Notifications */}
          <div className="grid lg:grid-cols-2 gap-8">
            <ProfileCard />
            <NotificationCard />
          </div>
        </div>
      </div>
    </div>
  );
}