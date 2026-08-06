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

const StudentDashboard = () => {
  return (
    <div className="flex bg-[#020617] min-h-screen">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">

        <Topbar />

        <div className="p-8 space-y-12">

          {/* Welcome */}
          <div>
            <h1 className="text-4xl font-bold text-white">
              Welcome Back 👋
            </h1>

            <p className="text-gray-400 mt-2">
              Here's an overview of your examination activity.
            </p>
          </div>

          {/* Statistics */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">

            <StatCard
              title="Total Exams"
              value="12"
              color="text-cyan-400"
            />

            <StatCard
              title="Completed"
              value="8"
              color="text-green-400"
            />

            <StatCard
              title="Upcoming"
              value="4"
              color="text-yellow-400"
            />

            <StatCard
              title="Average Score"
              value="91%"
              color="text-purple-400"
            />

          </div>

          {/* Analytics */}
          <AnalyticsCard />

          {/* Performance + Circular Progress */}
          <div className="grid lg:grid-cols-3 gap-8">

            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>

            <CircularProgress percentage={91} />

          </div>

          {/* AI Status + Calendar */}
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
                  date="12 Aug 2026"
                  time="10:00 AM"
                  status="Upcoming"
                />

                <ExamCard
                  subject="Database Management System"
                  date="18 Aug 2026"
                  time="02:00 PM"
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

          {/* AI Alerts + Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">

            <div>

              <h2 className="text-2xl font-bold text-white mb-6">
                AI Alerts
              </h2>

              <div className="space-y-5">

                <AlertCard
                  title="Face Detection"
                  message="Face verified successfully."
                  type="Info"
                />

                <AlertCard
                  title="Exam Reminder"
                  message="AI Exam starts tomorrow at 10:00 AM."
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
};

export default StudentDashboard;