import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaPlay,
  FaSpinner,
  FaCode,
  FaCheckCircle,
  FaTimesCircle,
  FaTerminal,
} from "react-icons/fa";
import api from "../../services/api";

// Text/code answers are saved this long after the student stops typing
const AUTOSAVE_DELAY_MS = 1500;

const isOptionType = (type) => type === "MCQ" || type === "TRUE_FALSE";

/**
 * Renders the exam questions and autosaves every answer (synopsis step 5).
 * The parent passes `answerSyncRef`; `answerSyncRef.current.flush()` resolves once
 * every pending answer has been sent — call it before submitting the exam.
 */
const QuestionPanel = ({ sessionId, answerSyncRef }) => {
  const [questions, setQuestions] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // questionId -> "saving" | "saved" | "error"
  const [saveStatus, setSaveStatus] = useState({});
  const [saveErrors, setSaveErrors] = useState({});

  const timersRef = useRef({});
  const pendingRef = useRef({});
  const inflightRef = useRef(new Set());

  // Coding Runner State
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeRunResult, setCodeRunResult] = useState(null);
  const [runError, setRunError] = useState("");

  // Load questions and any answers already saved (resume after reload)
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    Promise.all([
      api.get(`/sessions/${sessionId}/questions`),
      api.get(`/answers/session/${sessionId}`).catch(() => null),
    ])
      .then(([questionsRes, answersRes]) => {
        if (cancelled) return;
        const list = questionsRes.data?.data;
        if (!Array.isArray(list) || list.length === 0) {
          setLoadError("This exam has no questions assigned to you. Please contact your examiner.");
          setLoadState("error");
          return;
        }
        const restored = {};
        const restoredStatus = {};
        (answersRes?.data?.data || []).forEach((a) => {
          const value = a.selectedOption || a.textAnswer;
          if (value) {
            restored[a.questionId] = value;
            restoredStatus[a.questionId] = "saved";
          }
        });
        setQuestions(list);
        setAnswers((prev) => ({ ...restored, ...prev }));
        setSaveStatus((prev) => ({ ...restoredStatus, ...prev }));
        setLoadState("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load exam questions:", err);
        setLoadError(err.response?.data?.message || "Could not load the exam questions.");
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, reloadKey]);

  const saveNow = useCallback(
    (question, value) => {
      const qid = question.id;
      delete pendingRef.current[qid];
      clearTimeout(timersRef.current[qid]);
      if (!sessionId || !value || !String(value).trim()) return Promise.resolve();

      setSaveStatus((prev) => ({ ...prev, [qid]: "saving" }));
      const request = api
        .post("/answers", {
          sessionId: Number(sessionId),
          questionId: Number(qid),
          selectedOption: isOptionType(question.questionType) ? value : null,
          textAnswer: isOptionType(question.questionType) ? null : value,
        })
        .then(() => {
          setSaveStatus((prev) => ({ ...prev, [qid]: "saved" }));
          setSaveErrors((prev) => ({ ...prev, [qid]: "" }));
        })
        .catch((err) => {
          setSaveStatus((prev) => ({ ...prev, [qid]: "error" }));
          setSaveErrors((prev) => ({
            ...prev,
            [qid]: err.response?.data?.message || "Network error",
          }));
        })
        .finally(() => inflightRef.current.delete(request));
      inflightRef.current.add(request);
      return request;
    },
    [sessionId]
  );

  const flush = useCallback(async () => {
    Object.values(pendingRef.current).forEach(({ question, value }) => saveNow(question, value));
    await Promise.allSettled([...inflightRef.current]);
  }, [saveNow]);

  // Expose flush() to the parent so submit / time-up / auto-submit never lose answers
  useEffect(() => {
    if (answerSyncRef) answerSyncRef.current = { flush };
  }, [answerSyncRef, flush]);

  // Unmounting (e.g. navigating to results) still sends anything pending
  useEffect(
    () => () => {
      Object.values(pendingRef.current).forEach(({ question, value }) => saveNow(question, value));
    },
    [saveNow]
  );

  const currentQ = questions[currentIndex];
  const qType = currentQ?.questionType || "MCQ";

  // Pre-seed starter code for coding questions (not saved until the student edits it)
  useEffect(() => {
    if (!currentQ) return;
    if (qType === "CODING" && !answers[currentQ.id] && currentQ.metadata?.starterCode) {
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: currentQ.metadata.starterCode,
      }));
    }
    setCodeRunResult(null);
    setRunError("");
  }, [currentQ?.id, qType]);

  if (loadState !== "ready") {
    return (
      <div className="bg-[#121520] border border-white/7 rounded-xl p-8 text-center">
        {loadState === "loading" ? (
          <p className="text-sm text-slate-400">Loading questions...</p>
        ) : (
          <>
            <p className="text-sm text-rose-400">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoadState("loading");
                setReloadKey((k) => k + 1);
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-xs font-semibold transition"
            >
              Retry
            </button>
          </>
        )}
      </div>
    );
  }

  const currentAnswer = answers[currentQ.id] || "";
  const currentStatus = saveStatus[currentQ.id];
  const savedCount = Object.values(saveStatus).filter((st) => st === "saved").length;
  const hasPending = () => !!pendingRef.current[currentQ.id];

  const handleSelectOption = (key) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: key }));
    saveNow(currentQ, key);
  };

  const handleTextAnswerChange = (val) => {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: val }));
    pendingRef.current[currentQ.id] = { question: currentQ, value: val };
    clearTimeout(timersRef.current[currentQ.id]);
    const question = currentQ;
    timersRef.current[currentQ.id] = setTimeout(() => saveNow(question, val), AUTOSAVE_DELAY_MS);
  };

  const goTo = (index) => {
    // Send the current answer right away instead of waiting for the debounce
    if (hasPending()) saveNow(currentQ, pendingRef.current[currentQ.id].value);
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) {
      goTo(currentIndex + 1);
    } else if (hasPending()) {
      saveNow(currentQ, pendingRef.current[currentQ.id].value);
    }
  };

  // Run Code via backend Judge0 runner
  const handleRunCode = async () => {
    try {
      setCodeRunning(true);
      setRunError("");
      setCodeRunResult(null);

      const code =
        answers[currentQ.id] || currentQ.metadata?.starterCode || "";
      const language = currentQ.metadata?.language || "java";
      const testCases =
        Array.isArray(currentQ.metadata?.testCases) &&
        currentQ.metadata.testCases.length > 0
          ? currentQ.metadata.testCases
          : [{ input: "1", expectedOutput: "1" }];

      const res = await api.post("/code/run", {
        language,
        code,
        testCases,
      });

      setCodeRunResult(res.data?.data ?? res.data);
    } catch (err) {
      console.error("Code runner execution failed:", err);
      setRunError(
        err.response?.data?.message ||
          "Code runner failed. Please check syntax or server status."
      );
    } finally {
      setCodeRunning(false);
    }
  };

  const optionsEntries = currentQ.options
    ? typeof currentQ.options === "object" && !Array.isArray(currentQ.options)
      ? Object.entries(currentQ.options)
      : Array.isArray(currentQ.options)
      ? currentQ.options.map((opt, i) => [String.fromCharCode(65 + i), opt])
      : []
    : [];

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-6 sm:p-8 shadow-sm">
      {/* Question Header */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/6">
        <div>
          <span className="text-[11px] font-mono font-medium text-blue-400 uppercase tracking-wider">
            Assessment Section 1
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>
        <span className="text-xs text-slate-400 bg-white/4 border border-white/8 px-2.5 py-1 rounded-md font-mono">
          {qType} (+{currentQ.marks || 4} marks)
        </span>
      </div>

      <p className="text-slate-200 text-sm sm:text-base mb-6 leading-relaxed">
        {currentQ.questionText}
      </p>

      {/* Answer Input Renderers based on questionType */}

      {/* 1. MCQ & TRUE_FALSE */}
      {(qType === "MCQ" || qType === "TRUE_FALSE") && (
        <div className="space-y-3">
          {optionsEntries.map(([key, text]) => {
            const isSelected = currentAnswer === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectOption(key)}
                className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm font-medium flex items-center gap-3.5 ${
                  isSelected
                    ? "bg-blue-600/15 border-blue-500/50 text-white shadow-sm"
                    : "bg-[#090a0f] border-white/7 text-slate-300 hover:border-white/15 hover:bg-white/2"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-semibold shrink-0 transition-colors ${
                    isSelected
                      ? "border-blue-400 bg-blue-500 text-white"
                      : "border-slate-700 bg-slate-800 text-slate-400"
                  }`}
                >
                  {key}
                </div>
                <span>{String(text)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 2. FILL_BLANK */}
      {qType === "FILL_BLANK" && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-400">
            Your Answer:
          </label>
          <input
            type="text"
            value={currentAnswer}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full bg-[#090a0f] border border-white/8 focus:border-blue-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition"
          />
        </div>
      )}

      {/* 3. DESCRIPTIVE */}
      {qType === "DESCRIPTIVE" && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-medium text-slate-400">
              Detailed Response:
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0}{" "}
              words
            </span>
          </div>
          <textarea
            rows="6"
            value={currentAnswer}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Provide your complete solution or explanation..."
            className="w-full bg-[#090a0f] border border-white/8 focus:border-blue-500 rounded-xl p-4 text-xs sm:text-sm text-white outline-none transition resize-none leading-relaxed"
          />
        </div>
      )}

      {/* 4. CODING */}
      {qType === "CODING" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCode className="text-blue-400" size={13} />
              <span className="text-xs font-semibold text-slate-300">
                Code Editor (
                {currentQ.metadata?.language?.toUpperCase() || "JAVA"})
              </span>
            </div>

            <button
              type="button"
              onClick={handleRunCode}
              disabled={codeRunning}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
            >
              {codeRunning ? (
                <>
                  <FaSpinner size={10} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <FaPlay size={9} />
                  Run Code
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <textarea
              rows="12"
              value={currentAnswer}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              placeholder="// Write your code solution here..."
              className="w-full bg-[#090a0f] border border-white/8 focus:border-blue-500 rounded-xl p-4 text-xs font-mono text-emerald-300 outline-none transition resize-y leading-5"
              spellCheck="false"
            />
          </div>

          {/* Code Execution Results Panel */}
          {codeRunResult && (
            <div className="p-4 rounded-xl border border-white/8 bg-[#090a0f] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-white/6">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <FaTerminal size={11} className="text-blue-400" />
                  Test Results
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    codeRunResult.failed === 0
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {codeRunResult.passed || 0} /{" "}
                  {codeRunResult.totalTests || 0} Passed
                </span>
              </div>

              {Array.isArray(codeRunResult.results) &&
                codeRunResult.results.map((tr, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white/2 border border-white/4 text-[11px] font-mono space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">
                        Test Case {idx + 1}
                      </span>
                      <span
                        className={
                          tr.status === "PASSED"
                            ? "text-emerald-400 flex items-center gap-1"
                            : "text-rose-400 flex items-center gap-1"
                        }
                      >
                        {tr.status === "PASSED" ? (
                          <FaCheckCircle size={10} />
                        ) : (
                          <FaTimesCircle size={10} />
                        )}
                        {tr.status}
                      </span>
                    </div>
                    {tr.input && (
                      <p className="text-slate-500">
                        Input: <span className="text-slate-300">{tr.input}</span>
                      </p>
                    )}
                    {tr.expectedOutput && (
                      <p className="text-slate-500">
                        Expected:{" "}
                        <span className="text-emerald-400">
                          {tr.expectedOutput}
                        </span>
                      </p>
                    )}
                    {tr.actualOutput && (
                      <p className="text-slate-500">
                        Output:{" "}
                        <span className="text-slate-200">
                          {tr.actualOutput}
                        </span>
                      </p>
                    )}
                    {tr.compileError && (
                      <p className="text-rose-400 text-[10px] bg-rose-500/10 p-1.5 rounded">
                        {tr.compileError}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          )}

          {runError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {runError}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/6">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="bg-[#090a0f] hover:bg-white/4 disabled:opacity-40 disabled:cursor-not-allowed border border-white/8 px-5 py-2.5 rounded-lg text-xs font-medium text-slate-300 transition"
        >
          Previous
        </button>

        <div className="text-xs font-mono text-center">
          <div className="text-slate-500">{savedCount} of {questions.length} saved</div>
          {currentStatus === "saving" && <div className="text-blue-400 mt-0.5">Saving...</div>}
          {currentStatus === "saved" && <div className="text-emerald-400 mt-0.5">✓ Answer saved</div>}
          {currentStatus === "error" && (
            <div className="text-rose-400 mt-0.5">
              Not saved ({saveErrors[currentQ.id]}) —{" "}
              <button
                type="button"
                onClick={() => saveNow(currentQ, currentAnswer)}
                className="underline hover:text-rose-300"
              >
                retry
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveAndNext}
          disabled={currentIndex === questions.length - 1}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition active:scale-[0.98]"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default QuestionPanel;
