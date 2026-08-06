import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import ResultCard from "../../components/common/ResultCard";

const Results = () => {
  return (
    <div className="flex bg-[#020617] min-h-screen">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="p-8">

          <h2 className="text-4xl font-bold text-white">
            Exam Results
          </h2>

          <p className="text-gray-400 mt-2">
            View all your completed examination results.
          </p>

          <div className="grid lg:grid-cols-2 gap-6 mt-10">

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

        </div>

      </div>

    </div>
  );
};

export default Results;