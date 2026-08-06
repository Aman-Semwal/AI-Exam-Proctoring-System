import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import WebcamCard from "../../components/exam/WebcamCard";
import QuestionPanel from "../../components/exam/QuestionPanel";
import ExamTimer from "../../components/exam/ExamTimer";
import AIStatus from "../../components/exam/AIStatus";
import SubmitCard from "../../components/exam/SubmitCard";

const LiveExam = () => {
  return (
    <div className="flex bg-[#020617] min-h-screen">

      <Sidebar />

      <div className="flex-1">

        <Topbar />

        <div className="grid lg:grid-cols-3 gap-8 p-8">

          {/* Left */}
          <div className="lg:col-span-2">
            <QuestionPanel />
          </div>

          {/* Right */}
          <div className="space-y-6">

            <WebcamCard />

            <ExamTimer />

            <AIStatus />

            <SubmitCard />

          </div>

        </div>

      </div>

    </div>
  );
};

export default LiveExam;