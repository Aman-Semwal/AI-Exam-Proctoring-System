import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import ResultCard from "../../components/common/ResultCard";

const Results = () => {
  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Exam Results
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              View all your completed examination results and scores.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard
              subject="Artificial Intelligence"
              marks="96%"
              grade="A+"
              status="Passed"
            />
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
              subject="Database Management"
              marks="91%"
              grade="A"
              status="Passed"
            />
            <ResultCard
              subject="Software Engineering"
              marks="95%"
              grade="A+"
              status="Passed"
            />
            <ResultCard
              subject="Cyber Security"
              marks="90%"
              grade="A"
              status="Passed"
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;