import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import WebcamCard from "../../components/exam/WebcamCard";
import QuestionPanel from "../../components/exam/QuestionPanel";
import ExamTimer from "../../components/exam/ExamTimer";
import AIStatus from "../../components/exam/AIStatus";
import SubmitCard from "../../components/exam/SubmitCard";

import api from "../../services/api";

const LiveExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const examId = searchParams.get("examId");
  const existingSessionId = searchParams.get("sessionId");

  const [sessionId, setSessionId] = useState(existingSessionId);
  const [examTitle, setExamTitle] = useState(
    "B.Tech CSE — Final Algorithm Exam"
  );
  const [loading, setLoading] = useState(!existingSessionId);
  const [error, setError] = useState("");

  useEffect(() => {
    const startExamSession = async () => {
      // Already have session ID
      if (existingSessionId) {
        setSessionId(existingSessionId);
        setLoading(false);
        return;
      }

      // Exam ID is required to start session
      if (!examId) {
        setError("Exam ID is missing. Please select an exam first.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await api.post("/sessions/start", {
          examId: Number(examId),
        });

        const sessionData = response.data?.data;

        if (!sessionData?.id) {
          throw new Error("Session ID was not returned by the server.");
        }

        const newSessionId = sessionData.id;

        setSessionId(String(newSessionId));

        if (sessionData.examTitle) {
          setExamTitle(sessionData.examTitle);
        }

        // Put session ID into URL
        navigate(
          `/student/live-exam?examId=${examId}&sessionId=${newSessionId}`,
          { replace: true }
        );
      } catch (err) {
        console.error("Failed to start exam session:", err);

        setError(
          err.response?.data?.message ||
            "Unable to start the exam session. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    startExamSession();
  }, [examId, existingSessionId, navigate]);

  // Loading screen
  if (loading) {
    return (
      <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />

          <main className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <h2 className="text-lg font-semibold text-white">
                Starting Exam...
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                Please wait while your exam session is being created.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Error screen
  if (error) {
    return (
      <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />

          <main className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white/[0.03] border border-red-500/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>

              <h2 className="text-lg font-semibold text-white">
                Unable to Start Exam
              </h2>

              <p className="text-sm text-red-300 mt-3">
                {error}
              </p>

              <button
                onClick={() => navigate("/student/dashboard")}
                className="mt-6 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
              >
                Back to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-[#090a0f] min-h-screen text-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-6 lg:p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Exam Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/[0.06]">
            <div>
              <span className="text-[11px] font-mono text-blue-400 font-semibold uppercase tracking-wider">
                Active Assessment
              </span>

              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                {examTitle}
              </h1>

              <p className="text-[11px] text-slate-500 mt-1">
                Exam ID: {examId || "N/A"}
                {sessionId ? ` • Session ID: ${sessionId}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Proctored & Monitored
            </div>
          </div>

          {/* Exam Workspace */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Questions */}
            <div className="lg:col-span-8">
              <QuestionPanel
                examId={examId}
                sessionId={sessionId}
              />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <ExamTimer sessionId={sessionId} />

              <WebcamCard sessionId={sessionId} />

              <AIStatus />

              <SubmitCard sessionId={sessionId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LiveExam;