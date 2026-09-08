import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import WebcamCard from "../../components/exam/WebcamCard";
import QuestionPanel from "../../components/exam/QuestionPanel";
import ExamTimer from "../../components/exam/ExamTimer";
import AIStatus from "../../components/exam/AIStatus";
import SubmitCard from "../../components/exam/SubmitCard";

const LiveExam = () => {
  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
                Active Assessment
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                B.Tech CSE — Final Algorithm Exam
              </h1>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Proctored & Monitored
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Main Question Workspace (8 cols) */}
            <div className="lg:col-span-8">
              <QuestionPanel />
            </div>

            {/* Sidebar Telemetry & Actions (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              <ExamTimer />
              <WebcamCard />
              <AIStatus />
              <SubmitCard />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LiveExam;