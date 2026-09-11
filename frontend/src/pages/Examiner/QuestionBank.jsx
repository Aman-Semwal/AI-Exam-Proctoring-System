import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaClipboardList,
} from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";

export default function QuestionBank() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const examIdFromUrl = searchParams.get("examId");

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(
    examIdFromUrl || ""
  );

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteQuestion, setDeleteQuestion] = useState(null);

  // Question form
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState("1");
  const [track, setTrack] = useState("COMMON");

  // MCQ options
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctOption, setCorrectOption] = useState("A");

  // Descriptive
  const [maxWords, setMaxWords] = useState("");
  const [rubric, setRubric] = useState("");

  // Coding
  const [language, setLanguage] = useState("java");
  const [starterCode, setStarterCode] = useState("");
  const [testCases, setTestCases] = useState([
    { input: "", expectedOutput: "" },
  ]);

  // Fill blank
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");

  // True / False
  const [trueFalseAnswer, setTrueFalseAnswer] = useState("True");

  // --------------------------------------------------
  // Fetch exams
  // --------------------------------------------------
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/exams");

        const data = response.data?.data;

        const examList = Array.isArray(data)
          ? data
          : data?.content || data?.exams || [];

        setExams(examList);

        if (!selectedExamId && examList.length > 0) {
          setSelectedExamId(String(examList[0].id));
        }
      } catch (err) {
        console.error("Failed to fetch exams:", err);

        setError(
          err.response?.data?.message ||
            "Unable to load exams."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  // --------------------------------------------------
  // Fetch questions
  // --------------------------------------------------
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!selectedExamId) {
        setQuestions([]);
        return;
      }

      try {
        setQuestionsLoading(true);
        setError("");

        const response = await api.get(
          `/questions/exam/${selectedExamId}`
        );

        const data = response.data?.data;

        const questionList = Array.isArray(data)
          ? data
          : data?.content || data?.questions || [];

        setQuestions(questionList);
      } catch (err) {
        console.error("Failed to fetch questions:", err);

        setQuestions([]);

        setError(
          err.response?.data?.message ||
            "Unable to load questions."
        );
      } finally {
        setQuestionsLoading(false);
      }
    };

    fetchQuestions();
  }, [selectedExamId]);

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------
  const resetForm = () => {
    setQuestionType("MCQ");
    setQuestionText("");
    setMarks("1");
    setTrack("COMMON");

    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectOption("A");

    setMaxWords("");
    setRubric("");

    setLanguage("java");
    setStarterCode("");
    setTestCases([
      { input: "", expectedOutput: "" },
    ]);

    setFillBlankAnswer("");
    setTrueFalseAnswer("True");

    setEditingQuestion(null);
  };

  // --------------------------------------------------
  // Open create modal
  // --------------------------------------------------
  const openCreateModal = () => {
    resetForm();
    setError("");
    setMessage("");
    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // Open edit modal
  // --------------------------------------------------
  const openEditModal = (question) => {
    resetForm();

    setError("");
    setMessage("");

    setEditingQuestion(question);

    setQuestionType(question.questionType || "MCQ");
    setQuestionText(question.questionText || "");
    setMarks(
      question.marks !== undefined && question.marks !== null
        ? String(question.marks)
        : "1"
    );
    setTrack(question.track || "COMMON");

    const options = question.options || {};

    setOptionA(options.A || "");
    setOptionB(options.B || "");
    setOptionC(options.C || "");
    setOptionD(options.D || "");

    setCorrectOption(question.correctOption || "A");

    const metadata = question.metadata || {};

    setMaxWords(
      metadata.maxWords !== undefined
        ? String(metadata.maxWords)
        : ""
    );

    setRubric(metadata.rubric || "");

    setLanguage(metadata.language || "java");
    setStarterCode(metadata.starterCode || "");

    if (
      Array.isArray(metadata.testCases) &&
      metadata.testCases.length > 0
    ) {
      setTestCases(metadata.testCases);
    }

    if (question.questionType === "FILL_BLANK") {
      setFillBlankAnswer(question.correctOption || "");
    }

    if (question.questionType === "TRUE_FALSE") {
      setTrueFalseAnswer(question.correctOption || "True");
    }

    setIsModalOpen(true);
  };

  // --------------------------------------------------
  // Build request payload
  // --------------------------------------------------
  const buildPayload = () => {
    const payload = {
      examId: Number(selectedExamId),
      questionType,
      questionText: questionText.trim(),
      marks: Number(marks),
      track: track.trim() || "COMMON",
      options: null,
      correctOption: null,
      metadata: null,
    };

    if (questionType === "MCQ") {
      payload.options = {
        A: optionA.trim(),
        B: optionB.trim(),
        C: optionC.trim(),
        D: optionD.trim(),
      };

      payload.correctOption = correctOption;

      payload.metadata = {};
    }

    if (questionType === "TRUE_FALSE") {
      payload.options = {
        A: "True",
        B: "False",
      };

      payload.correctOption = trueFalseAnswer;

      payload.metadata = {};
    }

    if (questionType === "FILL_BLANK") {
      payload.correctOption = fillBlankAnswer.trim();
      payload.metadata = {};
    }

    if (questionType === "DESCRIPTIVE") {
      payload.metadata = {
        ...(maxWords
          ? { maxWords: Number(maxWords) }
          : {}),
        ...(rubric.trim()
          ? { rubric: rubric.trim() }
          : {}),
      };
    }

    if (questionType === "CODING") {
      payload.metadata = {
        language,
        starterCode,
        testCases,
      };
    }

    return payload;
  };

  // --------------------------------------------------
  // Validate form
  // --------------------------------------------------
  const validateForm = () => {
    if (!selectedExamId) {
      setError("Please select an exam.");
      return false;
    }

    if (!questionText.trim()) {
      setError("Question text is required.");
      return false;
    }

    if (!marks || Number(marks) < 1) {
      setError("Marks must be at least 1.");
      return false;
    }

    if (questionType === "MCQ") {
      if (
        !optionA.trim() ||
        !optionB.trim() ||
        !optionC.trim() ||
        !optionD.trim()
      ) {
        setError("Please enter all four MCQ options.");
        return false;
      }
    }

    if (questionType === "FILL_BLANK") {
      if (!fillBlankAnswer.trim()) {
        setError("Please enter the expected answer.");
        return false;
      }
    }

    if (questionType === "DESCRIPTIVE") {
      if (maxWords && Number(maxWords) < 1) {
        setError("Maximum words must be at least 1.");
        return false;
      }
    }

    if (questionType === "CODING") {
      if (!language.trim()) {
        setError("Please select a programming language.");
        return false;
      }
    }

    return true;
  };

  // --------------------------------------------------
  // Create / Update question
  // --------------------------------------------------
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = buildPayload();

      let response;

      if (editingQuestion) {
        response = await api.put(
          `/questions/${editingQuestion.id}`,
          payload
        );

        const updatedQuestion = response.data?.data;

        if (updatedQuestion) {
          setQuestions((prev) =>
            prev.map((question) =>
              question.id === editingQuestion.id
                ? updatedQuestion
                : question
            )
          );
        }

        setMessage("Question updated successfully.");
      } else {
        response = await api.post("/questions", payload);

        const createdQuestion = response.data?.data;

        if (createdQuestion) {
          setQuestions((prev) => [
            ...prev,
            createdQuestion,
          ]);
        } else {
          const refreshResponse = await api.get(
            `/questions/exam/${selectedExamId}`
          );

          const data = refreshResponse.data?.data;

          const questionList = Array.isArray(data)
            ? data
            : data?.content || data?.questions || [];

          setQuestions(questionList);
        }

        setMessage("Question added successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(
        editingQuestion
          ? "Failed to update question:"
          : "Failed to create question:",
        err
      );

      setError(
        err.response?.data?.message ||
          (editingQuestion
            ? "Unable to update question."
            : "Unable to add question.")
      );
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // Delete question
  // --------------------------------------------------
  const handleDeleteQuestion = async () => {
    if (!deleteQuestion?.id) return;

    try {
      setDeleting(true);
      setError("");
      setMessage("");

      await api.delete(
        `/questions/${deleteQuestion.id}`
      );

      setQuestions((prev) =>
        prev.filter(
          (question) =>
            question.id !== deleteQuestion.id
        )
      );

      setDeleteQuestion(null);

      setMessage("Question deleted successfully.");
    } catch (err) {
      console.error("Failed to delete question:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete question."
      );
    } finally {
      setDeleting(false);
    }
  };

  // --------------------------------------------------
  // Test case helpers
  // --------------------------------------------------
  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input: "", expectedOutput: "" },
    ]);
  };

  const removeTestCase = (index) => {
    setTestCases((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const updateTestCase = (index, field, value) => {
    setTestCases((prev) =>
      prev.map((testCase, i) =>
        i === index
          ? { ...testCase, [field]: value }
          : testCase
      )
    );
  };

  const getTypeLabel = (type) => {
    const labels = {
      MCQ: "MCQ",
      TRUE_FALSE: "True / False",
      FILL_BLANK: "Fill in the Blank",
      DESCRIPTIVE: "Descriptive",
      CODING: "Coding",
    };

    return labels[type] || type;
  };

  const selectedExam = exams.find(
    (exam) => String(exam.id) === String(selectedExamId)
  );

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/[0.07] bg-[#0d0f17]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate("/examiner/dashboard")
              }
              className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition"
              title="Back to Dashboard"
            >
              <FaArrowLeft size={13} />
            </button>

            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaClipboardList size={16} />
            </div>

            <div>
              <h1 className="text-base font-bold text-white">
                Question Bank
              </h1>

              <p className="text-[11px] text-slate-400">
                Create and manage exam questions
              </p>
            </div>
          </div>

          <button
            onClick={openCreateModal}
            disabled={!selectedExamId}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center gap-2 transition"
          >
            <FaPlus size={11} />
            Add Question
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 lg:p-8">
        {/* Messages */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 flex justify-between gap-3">
            <p className="text-xs text-red-300">
              {error}
            </p>

            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-200"
            >
              <FaTimes size={12} />
            </button>
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-xs text-emerald-300">
              {message}
            </p>
          </div>
        )}

        {/* Exam selector */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5 mb-6">
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Select Exam
          </label>

          {loading ? (
            <p className="text-xs text-slate-500">
              Loading exams...
            </p>
          ) : (
            <select
              value={selectedExamId}
              onChange={(e) =>
                setSelectedExamId(e.target.value)
              }
              className="w-full max-w-xl px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">
                Select an exam
              </option>

              {exams.map((exam) => (
                <option
                  key={exam.id}
                  value={exam.id}
                >
                  {exam.title || `Exam #${exam.id}`}
                </option>
              ))}
            </select>
          )}

          {selectedExam && (
            <p className="text-[11px] text-slate-500 mt-2">
              Managing questions for:{" "}
              <span className="text-slate-300">
                {selectedExam.title}
              </span>
            </p>
          )}
        </div>

        {/* Stats */}
        {selectedExamId && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Total Questions
              </p>

              <p className="text-3xl font-bold text-white mt-2 font-mono">
                {questionsLoading ? "..." : questions.length}
              </p>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Total Marks
              </p>

              <p className="text-3xl font-bold text-blue-400 mt-2 font-mono">
                {questionsLoading
                  ? "..."
                  : questions.reduce(
                      (sum, question) =>
                        sum + Number(question.marks || 0),
                      0
                    )}
              </p>
            </div>

            <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider">
                Question Types
              </p>

              <p className="text-sm font-semibold text-white mt-3">
                {[
                  ...new Set(
                    questions.map(
                      (question) =>
                        question.questionType
                    )
                  ),
                ].length || 0}{" "}
                types used
              </p>
            </div>
          </div>
        )}

        {/* Questions */}
        <div className="bg-[#121520] border border-white/[0.07] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">
                Questions
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Add, edit or delete questions from this exam.
              </p>
            </div>
          </div>

          {!selectedExamId ? (
            <div className="py-14 text-center">
              <p className="text-sm text-slate-500">
                Select an exam to view its questions.
              </p>
            </div>
          ) : questionsLoading ? (
            <div className="py-14 text-center">
              <div className="w-9 h-9 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />

              <p className="text-xs text-slate-400">
                Loading questions...
              </p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-14 text-center">
              <FaClipboardList
                className="mx-auto text-slate-600 mb-3"
                size={30}
              />

              <p className="text-sm text-slate-400">
                No questions added yet.
              </p>

              <button
                onClick={openCreateModal}
                className="mt-4 text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                + Add your first question
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-white/[0.07] rounded-xl p-4 hover:bg-white/[0.02] transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-semibold">
                            {getTypeLabel(
                              question.questionType
                            )}
                          </span>

                          <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold">
                            {question.marks || 0} marks
                          </span>

                          {question.track && (
                            <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-400 text-[10px]">
                              {question.track}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-white font-medium leading-6">
                          {question.questionText}
                        </p>

                        {question.questionType ===
                          "MCQ" &&
                          question.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              {Object.entries(
                                question.options
                              ).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className={`text-xs px-3 py-2 rounded-lg border ${
                                      question.correctOption ===
                                      key
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                                        : "bg-[#090a0f] border-white/[0.06] text-slate-400"
                                    }`}
                                  >
                                    <span className="font-semibold mr-2">
                                      {key}.
                                    </span>
                                    {value}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(question)
                        }
                        title="Edit Question"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition"
                      >
                        <FaEdit size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setMessage("");
                          setDeleteQuestion(question);
                        }}
                        title="Delete Question"
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingQuestion
                    ? "Edit Question"
                    : "Add New Question"}
                </h3>

                <p className="text-[11px] text-slate-500 mt-1">
                  {selectedExam?.title || "Selected Exam"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <form
              onSubmit={handleQuestionSubmit}
              className="space-y-4 text-xs"
            >
              {/* Type + Marks + Track */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Question Type *
                  </label>

                  <select
                    value={questionType}
                    onChange={(e) =>
                      setQuestionType(e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="MCQ">MCQ</option>
                    <option value="TRUE_FALSE">
                      True / False
                    </option>
                    <option value="FILL_BLANK">
                      Fill in the Blank
                    </option>
                    <option value="DESCRIPTIVE">
                      Descriptive
                    </option>
                    <option value="CODING">
                      Coding
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Marks *
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={marks}
                    onChange={(e) =>
                      setMarks(e.target.value)
                    }
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Track
                  </label>

                  <input
                    type="text"
                    value={track}
                    onChange={(e) =>
                      setTrack(e.target.value)
                    }
                    placeholder="COMMON"
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Question */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Question *
                </label>

                <textarea
                  value={questionText}
                  onChange={(e) =>
                    setQuestionText(e.target.value)
                  }
                  rows="4"
                  placeholder="Enter your question..."
                  className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* MCQ */}
              {questionType === "MCQ" && (
                <div className="space-y-3">
                  <p className="text-slate-300 font-semibold">
                    Options
                  </p>

                  {[
                    ["A", optionA, setOptionA],
                    ["B", optionB, setOptionB],
                    ["C", optionC, setOptionC],
                    ["D", optionD, setOptionD],
                  ].map(([letter, value, setter]) => (
                    <div
                      key={letter}
                      className="flex gap-2"
                    >
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                        {letter}
                      </div>

                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          setter(e.target.value)
                        }
                        placeholder={`Option ${letter}`}
                        className="flex-1 px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Correct Option *
                    </label>

                    <select
                      value={correctOption}
                      onChange={(e) =>
                        setCorrectOption(e.target.value)
                      }
                      className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                </div>
              )}

              {/* True False */}
              {questionType === "TRUE_FALSE" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Correct Answer *
                  </label>

                  <select
                    value={trueFalseAnswer}
                    onChange={(e) =>
                      setTrueFalseAnswer(
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {/* Fill Blank */}
              {questionType === "FILL_BLANK" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Expected Answer *
                  </label>

                  <input
                    type="text"
                    value={fillBlankAnswer}
                    onChange={(e) =>
                      setFillBlankAnswer(
                        e.target.value
                      )
                    }
                    placeholder="Enter expected answer"
                    className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Descriptive */}
              {questionType === "DESCRIPTIVE" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Maximum Words
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={maxWords}
                      onChange={(e) =>
                        setMaxWords(e.target.value)
                      }
                      placeholder="e.g. 200"
                      className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Rubric
                    </label>

                    <textarea
                      value={rubric}
                      onChange={(e) =>
                        setRubric(e.target.value)
                      }
                      rows="3"
                      placeholder="Mention key points expected in the answer..."
                      className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Coding */}
              {questionType === "CODING" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Programming Language *
                    </label>

                    <select
                      value={language}
                      onChange={(e) =>
                        setLanguage(e.target.value)
                      }
                      className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="python">Python</option>
                      <option value="javascript">
                        JavaScript
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      Starter Code
                    </label>

                    <textarea
                      value={starterCode}
                      onChange={(e) =>
                        setStarterCode(
                          e.target.value
                        )
                      }
                      rows="6"
                      placeholder="Enter starter code..."
                      className="w-full px-3 py-2.5 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-slate-300 font-medium">
                        Test Cases
                      </label>

                      <button
                        type="button"
                        onClick={addTestCase}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        + Add Test Case
                      </button>
                    </div>

                    <div className="space-y-3">
                      {testCases.map(
                        (testCase, index) => (
                          <div
                            key={index}
                            className="border border-white/[0.07] rounded-lg p-3"
                          >
                            <div className="flex justify-between mb-2">
                              <span className="text-[11px] text-slate-500">
                                Test Case {index + 1}
                              </span>

                              {testCases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeTestCase(
                                      index
                                    )
                                  }
                                  className="text-rose-400 hover:text-rose-300"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={
                                  testCase.input
                                }
                                onChange={(e) =>
                                  updateTestCase(
                                    index,
                                    "input",
                                    e.target.value
                                  )
                                }
                                placeholder="Input"
                                className="px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                              />

                              <input
                                type="text"
                                value={
                                  testCase.expectedOutput
                                }
                                onChange={(e) =>
                                  updateTestCase(
                                    index,
                                    "expectedOutput",
                                    e.target.value
                                  )
                                }
                                placeholder="Expected Output"
                                className="px-3 py-2 bg-[#090a0f] border border-white/[0.08] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-[#090a0f] hover:bg-white/[0.04] text-slate-300 rounded-lg font-medium border border-white/[0.08] transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                >
                  {saving
                    ? editingQuestion
                      ? "Updating..."
                      : "Adding..."
                    : editingQuestion
                    ? "Update Question"
                    : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteQuestion && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-white/[0.1] rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Delete Question?
              </h3>

              <button
                type="button"
                onClick={() =>
                  setDeleteQuestion(null)
                }
                disabled={deleting}
                className="text-slate-400 hover:text-white"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-5">
              This question will be permanently deleted.
            </p>

            <div className="mt-4 rounded-lg bg-rose-500/5 border border-rose-500/15 p-3">
              <p className="text-xs text-slate-300 line-clamp-3">
                {deleteQuestion.questionText}
              </p>
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() =>
                  setDeleteQuestion(null)
                }
                disabled={deleting}
                className="px-4 py-2 bg-[#090a0f] text-slate-300 rounded-lg border border-white/[0.08]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteQuestion}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg font-semibold"
              >
                {deleting
                  ? "Deleting..."
                  : "Delete Question"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}