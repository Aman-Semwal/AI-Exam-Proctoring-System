import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaShieldAlt,
  FaSearch,
  FaSignOutAlt,
  FaRedo,
  FaEye,
  FaCheckCircle,
  FaTimes,
  FaExclamationTriangle,
  FaPlus,
  FaFilter,
  FaBolt,
  FaWifi,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Toast from "../../components/common/Toast";
import api from "../../services/api";
import useWebSocket from "../../services/useWebSocket";
import EvidenceImage from "../../components/common/EvidenceImage";
import LiveSessionsPanel from "../../components/proctor/LiveSessionsPanel";

// ─── helpers ──────────────────────────────────────────────────────────────────

const getList = (response) => {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.sessions)) return data.sessions;
  if (Array.isArray(data?.violations)) return data.violations;
  return [];
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const normalizeSeverity = (severity) => {
  const value = String(severity || "LOW").toUpperCase();
  if (value === "CRITICAL") return "Critical";
  if (value === "HIGH") return "High";
  if (value === "MEDIUM") return "Medium";
  return "Low";
};

const EVENT_TYPE_COLORS = {
  FACE_DETECTED:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  NO_FACE_DETECTED:
    "bg-rose-500/10 text-rose-400 border-rose-500/20",
  MULTIPLE_FACES_DETECTED:
    "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const eventBadgeClass = (eventType) =>
  EVENT_TYPE_COLORS[eventType] ??
  "bg-slate-500/10 text-slate-400 border-slate-500/20";

// ─── component ────────────────────────────────────────────────────────────────

export default function ProctorDashboard() {
  const navigate = useNavigate();

  // ── existing state ──────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [incidents, setIncidents] = useState([]);
  const [liveExams, setLiveExams] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Review Incident Modal
  const [reviewingIncident, setReviewingIncident] = useState(null);
  const [reviewing, setReviewing] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ── new state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("violations"); // 'violations' | 'events' | 'sessions'
  const [showUnreviewedOnly, setShowUnreviewedOnly] = useState(false);
  const [liveSessions, setLiveSessions] = useState([]); // kept for dropdowns

  // WebSocket: track active exam IDs for real-time subscriptions
  const [activeExamIds, setActiveExamIds] = useState([]);

  // Feature 1 — Proctoring Events
  const [selectedEventSession, setSelectedEventSession] = useState("");
  const [sessionEvents, setSessionEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const eventsIntervalRef = useRef(null);

  // Feature 3 — Report Violation modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    sessionId: "",
    type: "",
    severity: "",
    details: "",
  });
  const [submittingReport, setSubmittingReport] = useState(false);

  // ── current user ────────────────────────────────────────────────────────────
  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  // ── logout ──────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── fetch dashboard data ────────────────────────────────────────────────────
  const fetchDashboardData = useCallback(
    async (unreviewedOnly = false) => {
      try {
        setLoading(true);
        setError("");

        const examsResponse = await api.get("/exams");
        const exams = getList(examsResponse);

        const activeExamList = exams.filter((exam) =>
          ["ACTIVE", "ONGOING", "LIVE", "PUBLISHED"].includes(
            String(exam.status || "").toUpperCase()
          )
        );

        setLiveExams(activeExamList.length);

        // Store active exam IDs for WebSocket subscriptions
        setActiveExamIds(activeExamList.map((e) => e.id));

        const sessionResponses = await Promise.all(
          activeExamList.map((exam) =>
            api
              .get(`/sessions/exam/${exam.id}`)
              .catch(() => ({ data: { data: [] } }))
          )
        );

        const sessions = sessionResponses.flatMap(getList);

        const activeSessionStatuses = [
          "ACTIVE",
          "ONGOING",
          "IN_PROGRESS",
          "LIVE",
        ];

        const live = sessions.filter((session) =>
          activeSessionStatuses.includes(
            String(session.status || "").toUpperCase()
          )
        );

        setActiveStudents(live.length);
        setLiveSessions(live); // store for dropdowns

        // Feature 2: choose endpoint based on filter toggle
        const violationEndpoint = (sessionId) =>
          unreviewedOnly
            ? `/violations/session/${sessionId}/unreviewed`
            : `/violations/session/${sessionId}`;

        const violationResponses = await Promise.all(
          live.map((session) =>
            api
              .get(violationEndpoint(session.id))
              .catch(() => ({ data: { data: [] } }))
          )
        );

        const violationData = violationResponses.flatMap(getList);

        const formattedIncidents = violationData.map((violation, index) => {
          const session = live.find(
            (item) => item.id === violation.sessionId
          );

          const exam = exams.find(
            (item) =>
              item.id === (violation.examId ?? session?.examId)
          );

          return {
            id: violation.id ?? `${violation.sessionId}-${index}`,
            rawId: violation.id,
            sessionId: violation.sessionId,

            student:
              violation.studentName ||
              session?.studentName ||
              violation.student?.name ||
              "Unknown Student",

            exam:
              violation.examTitle ||
              session?.examTitle ||
              exam?.title ||
              exam?.name ||
              "Unknown Exam",

            issue:
              violation.description ||
              violation.message ||
              violation.violationType ||
              violation.type ||
              "Proctoring violation",

            time: formatTime(
              violation.createdAt ||
                violation.timestamp ||
                violation.detectedAt
            ),

            severity: normalizeSeverity(
              violation.severity || violation.riskLevel
            ),

            reviewed: Boolean(violation.reviewed || violation.isReviewed),
          };
        });

        setIncidents(formattedIncidents);
      } catch (err) {
        console.error("Failed to load proctor dashboard:", err);
        setError(
          err?.response?.data?.message ||
            "Unable to load proctor dashboard data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Re-fetch when the unreviewed toggle changes
  useEffect(() => {
    fetchDashboardData(showUnreviewedOnly);
  }, [showUnreviewedOnly, fetchDashboardData]);

  // REST fallback — reduced to 60s since WebSocket is the primary real-time channel
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData(showUnreviewedOnly);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchDashboardData, showUnreviewedOnly]);

  // ── WebSocket: real-time violation alerts ──────────────────────────────────
  const wsOnAlert = useCallback(
    (alert) => {
      const newIncident = {
        id: alert.sessionId ? `ws-${alert.sessionId}-${Date.now()}` : `ws-${Date.now()}`,
        // The backend sends the stored violation's id, so the row can be reviewed right away
        rawId: alert.violationId ?? null,
        sessionId: alert.sessionId,
        student: alert.studentName || "Unknown Student",
        exam: alert.examTitle || "Live Exam",
        issue: alert.details || alert.eventType || "Proctoring violation",
        time: formatTime(new Date().toISOString()),
        severity: normalizeSeverity(
          alert.severity || (alert.eventType === "SESSION_TERMINATED" ? "Critical" : "High")
        ),
        reviewed: false,
      };

      setIncidents((prev) =>
        newIncident.rawId && prev.some((item) => item.rawId === newIncident.rawId)
          ? prev
          : [newIncident, ...prev]
      );
      setToast({
        type: "warning",
        message: `🚨 ${alert.studentName || "Student"}: ${alert.eventType || "Violation detected"}`,
      });
    },
    []
  );

  const { status: wsStatus } = useWebSocket({
    examIds: activeExamIds,
    onAlert: wsOnAlert,
    enabled: activeExamIds.length > 0,
  });

  // ── Feature 1: fetch proctoring events ─────────────────────────────────────
  const fetchEvents = useCallback(async (sessionId) => {
    if (!sessionId) return;
    try {
      setEventsLoading(true);
      const res = await api.get(`/proctor/session/${sessionId}/events`);
      const data = getList(res);
      setSessionEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch proctoring events:", err);
      setSessionEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  // When selectedEventSession changes: fetch immediately and start 10s interval
  useEffect(() => {
    // Clear any existing interval
    if (eventsIntervalRef.current) {
      clearInterval(eventsIntervalRef.current);
      eventsIntervalRef.current = null;
    }

    if (!selectedEventSession) {
      setSessionEvents([]);
      return;
    }

    fetchEvents(selectedEventSession);

    eventsIntervalRef.current = setInterval(() => {
      fetchEvents(selectedEventSession);
    }, 10000);

    return () => {
      if (eventsIntervalRef.current) {
        clearInterval(eventsIntervalRef.current);
        eventsIntervalRef.current = null;
      }
    };
  }, [selectedEventSession, fetchEvents]);

  // ── Feature 4: open review modal & fetch fresh violation detail ─────────────
  const handleOpenReview = async (item) => {
    setReviewingIncident(item); // show modal immediately with cached data
    if (!item.rawId) return;

    try {
      setModalLoading(true);
      const res = await api.get(`/violations/${item.rawId}`);
      const v = res?.data?.data ?? res?.data;
      if (!v) return;

      setReviewingIncident((prev) => ({
        ...prev,
        student: v.studentName || prev.student,
        exam: v.examTitle || prev.exam,
        issue: v.type || v.description || prev.issue,
        severity: normalizeSeverity(v.severity || prev.severity),
        time: formatTime(v.createdAt || prev.time),
        reviewed: Boolean(v.reviewed ?? prev.reviewed),
        reviewOutcome: v.reviewOutcome || null,
        hasEvidence: Boolean(v.hasEvidence),
        details: v.details || "",
      }));
    } catch (err) {
      console.error("Failed to fetch violation detail:", err);
      // keep cached data — no toast needed, just stale display
    } finally {
      setModalLoading(false);
    }
  };

  // ── filtered incidents ──────────────────────────────────────────────────────
  const filteredIncidents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return incidents.filter(
      (item) =>
        item.student.toLowerCase().includes(query) ||
        item.exam.toLowerCase().includes(query) ||
        item.issue.toLowerCase().includes(query)
    );
  }, [incidents, searchQuery]);

  const pendingAlerts = incidents.filter(
    (item) =>
      ["High", "Critical"].includes(item.severity) && !item.reviewed
  ).length;

  // ── mark reviewed ────────────────────────────────────────────────────────────
  // outcome: "CONFIRMED" or "DISMISSED" (false positive — no longer lowers the trust score)
  const handleMarkReviewed = async (outcome) => {
    if (!reviewingIncident) return;
    if (!reviewingIncident.rawId) {
      // Every violation alert carries its id, so this is a status notice (e.g. auto-submitted):
      // acknowledge it locally — there is no violation on the server to review
      setIncidents((prev) =>
        prev.map((item) => (item.id === reviewingIncident.id ? { ...item, reviewed: true } : item))
      );
      setToast({ type: "success", message: "Notice acknowledged." });
      setReviewingIncident(null);
      return;
    }
    try {
      setReviewing(true);
      await api.patch(`/violations/${reviewingIncident.rawId}/review`, { outcome });
      setIncidents((prev) =>
        prev.map((item) =>
          item.id === reviewingIncident.id
            ? { ...item, reviewed: true, reviewOutcome: outcome }
            : item
        )
      );
      setToast({
        type: "success",
        message:
          outcome === "DISMISSED"
            ? `Incident for ${reviewingIncident.student} dismissed as a false positive.`
            : `Incident for ${reviewingIncident.student} confirmed.`,
      });
      setReviewingIncident(null);
    } catch (err) {
      console.error("Review violation error:", err);
      setToast({
        type: "error",
        message:
          err.response?.data?.message || "Failed to mark incident reviewed.",
      });
    } finally {
      setReviewing(false);
    }
  };

  // ── Feature 3: submit report violation ─────────────────────────────────────
  const handleReportViolation = async (e) => {
    e.preventDefault();
    if (!reportForm.sessionId || !reportForm.type || !reportForm.severity)
      return;

    try {
      setSubmittingReport(true);
      const body = {
        sessionId: Number(reportForm.sessionId),
        type: reportForm.type,
        severity: reportForm.severity,
        details: reportForm.details || undefined,
      };
      const res = await api.post("/violations", body);
      const created = res?.data?.data ?? res?.data;

      // Add to incidents list
      const session = liveSessions.find(
        (s) => String(s.id) === String(reportForm.sessionId)
      );

      const newIncident = {
        id: created?.id ?? `manual-${Date.now()}`,
        rawId: created?.id ?? null,
        sessionId: Number(reportForm.sessionId),
        student:
          created?.studentName ||
          session?.studentName ||
          "Unknown Student",
        exam:
          created?.examTitle ||
          session?.examTitle ||
          "Unknown Exam",
        issue: reportForm.type,
        time: formatTime(created?.createdAt || new Date().toISOString()),
        severity: normalizeSeverity(reportForm.severity),
        reviewed: false,
      };

      setIncidents((prev) => [newIncident, ...prev]);
      setToast({ type: "success", message: "Violation reported successfully." });
      setShowReportModal(false);
      setReportForm({ sessionId: "", type: "", severity: "", details: "" });
    } catch (err) {
      console.error("Report violation error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to report violation.",
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-64 min-h-screen bg-[#0d0f17] border-r border-white/7 flex flex-col justify-between p-4 shrink-0 sticky top-0 h-screen">
        <div>
          <div
            className="p-3 mb-4 cursor-pointer flex items-center gap-3 group"
            onClick={() => navigate("/proctor/dashboard")}
          >
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
              <FaShieldAlt size={16} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                Proctor<span className="text-blue-400">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Invigilator Command
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 py-1.5">
              Surveillance
            </p>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold text-xs shadow-sm">
              <FaShieldAlt size={14} />
              <span>Control Center</span>
            </div>
          </nav>
        </div>

        <div className="space-y-2 pt-3 border-t border-white/7">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/3 border border-white/6">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold text-xs">
              {(currentUser?.name || "PR").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {currentUser?.name || "Proctor"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.role || "PROCTOR"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 py-2 rounded-lg transition"
          >
            <FaSignOutAlt size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/6">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Surveillance Room
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
              Proctor Control Center
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Live monitoring, anomaly alerts, and candidate violation tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* WebSocket connection indicator */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                wsStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : wsStatus === "connecting"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-rose-500/10 text-rose-400 border-rose-500/20"
              }`}
              title={`WebSocket: ${wsStatus}`}
            >
              <FaWifi size={11} />
              <span>
                {wsStatus === "connected"
                  ? "Live"
                  : wsStatus === "connecting"
                  ? "Reconnecting…"
                  : "Offline"}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3.5 py-1.5 rounded-lg border border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active Shift Monitoring
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchDashboardData(showUnreviewedOnly)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20"
            >
              <FaRedo size={11} />
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#121520] p-5 rounded-xl border border-white/7 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Live Exams
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-white mt-2 font-mono">
              {loading ? "—" : String(liveExams).padStart(2, "0")}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/7 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Active Students
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2 font-mono">
              {loading ? "—" : activeStudents}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/7 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Pending Alerts
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-2 font-mono">
              {loading ? "—" : pendingAlerts}
            </p>
          </div>

          <div className="bg-[#121520] p-5 rounded-xl border border-white/7 shadow-sm">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Violations Flagged
            </p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 font-mono">
              {loading ? "—" : incidents.length}
            </p>
          </div>
        </div>

        {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/6 pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("violations")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px ${
              activeTab === "violations"
                ? "text-white border-blue-500 bg-blue-500/5"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            Violations
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px flex items-center gap-1.5 ${
              activeTab === "events"
                ? "text-white border-blue-500 bg-blue-500/5"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            <FaBolt size={10} />
            Proctoring Events
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 -mb-px ${
              activeTab === "sessions"
                ? "text-white border-blue-500 bg-blue-500/5"
                : "text-slate-400 hover:text-slate-200 border-transparent"
            }`}
          >
            Live Sessions ({liveSessions.length})
          </button>
        </div>

        {activeTab === "sessions" && (
          <LiveSessionsPanel
            sessions={liveSessions}
            onChanged={() => fetchDashboardData(showUnreviewedOnly)}
            onToast={setToast}
          />
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Violations
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "violations" && (
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              {/* Search */}
              <div className="flex items-center bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 w-full sm:w-80">
                <FaSearch className="text-slate-500 text-xs mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by candidate, exam, or issue…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Right controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Feature 2: Unreviewed toggle */}
                <button
                  type="button"
                  onClick={() => setShowUnreviewedOnly((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    showUnreviewedOnly
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                      : "bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20 hover:text-slate-200"
                  }`}
                >
                  <FaFilter size={10} />
                  {showUnreviewedOnly ? "Unreviewed Only" : "Show Unreviewed Only"}
                </button>

                {/* Feature 3: Report Violation */}
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/25 transition"
                >
                  <FaPlus size={10} />
                  Report Violation
                </button>

                <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
                  Recorded Alerts:{" "}
                  <span className="font-semibold text-white">
                    {filteredIncidents.length}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => fetchDashboardData(showUnreviewedOnly)}
                  className="p-2 rounded-lg bg-white/4 hover:bg-white/8 text-slate-400 hover:text-white transition"
                  title="Refresh feed"
                >
                  <FaRedo size={11} />
                </button>
              </div>
            </div>

            {/* Violations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-187.5">
                <thead>
                  <tr className="border-b border-white/6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Student Name</th>
                    <th className="pb-3 px-3">Exam Context</th>
                    <th className="pb-3 px-3">Violation / Issue</th>
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3">Severity</th>
                    <th className="pb-3 px-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/4 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-500">
                        Loading live monitoring data…
                      </td>
                    </tr>
                  ) : filteredIncidents.length > 0 ? (
                    filteredIncidents.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-white/2 transition ${
                          item.reviewed ? "opacity-60" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3 font-semibold text-white">
                          {item.student}
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">{item.exam}</td>
                        <td className="py-3.5 px-3 text-slate-200 font-medium">
                          {item.issue}
                        </td>
                        <td className="py-3.5 px-3 text-slate-400 font-mono">
                          {item.time}
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              item.severity === "Critical" ||
                              item.severity === "High"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : item.severity === "Medium"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {item.severity}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenReview(item)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              item.reviewed
                                ? "bg-white/4 text-slate-400 border border-white/7 hover:bg-white/8"
                                : "bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/25"
                            }`}
                          >
                            <FaEye size={11} />
                            <span>{item.reviewed ? "Reviewed" : "Review"}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="6"
                        className="py-10 text-center text-slate-500 text-xs"
                      >
                        {showUnreviewedOnly
                          ? "No unreviewed violations found."
                          : "No violations or alerts found matching your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB: Proctoring Events (Feature 1)
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === "events" && (
          <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              {/* Session selector */}
              <div className="flex items-center gap-3">
                <label
                  htmlFor="event-session-select"
                  className="text-xs text-slate-400 font-medium shrink-0"
                >
                  Select Session:
                </label>
                <select
                  id="event-session-select"
                  value={selectedEventSession}
                  onChange={(e) => setSelectedEventSession(e.target.value)}
                  className="bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 min-w-55"
                >
                  <option value="">— Choose a live session —</option>
                  {liveSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName || s.examTitle || `Session #${s.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Right side */}
              <div className="flex items-center gap-3">
                {selectedEventSession && (
                  <span className="text-xs text-slate-400 font-mono">
                    Events:{" "}
                    <span className="font-semibold text-white">
                      {sessionEvents.length}
                    </span>
                  </span>
                )}
                {selectedEventSession && (
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                    Auto-refreshing every 10s
                  </span>
                )}
                {selectedEventSession && (
                  <button
                    type="button"
                    onClick={() => fetchEvents(selectedEventSession)}
                    className="p-2 rounded-lg bg-white/4 hover:bg-white/8 text-slate-400 hover:text-white transition"
                    title="Refresh events"
                  >
                    <FaRedo size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Events Table */}
            {!selectedEventSession ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select a live session above to view proctoring events.
              </div>
            ) : eventsLoading && sessionEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                Loading proctoring events…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-160">
                  <thead>
                    <tr className="border-b border-white/6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Detected At</th>
                      <th className="pb-3 px-3">Event Type</th>
                      <th className="pb-3 px-3">Face Count</th>
                      <th className="pb-3 px-3">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/4 text-xs">
                    {sessionEvents.length > 0 ? (
                      sessionEvents.map((ev) => (
                        <tr
                          key={ev.id}
                          className="hover:bg-white/2 transition"
                        >
                          <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                            {formatDateTime(ev.detectedAt)}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${eventBadgeClass(
                                ev.eventType
                              )}`}
                            >
                              {ev.eventType}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-300 font-mono">
                            {ev.faceCount ?? "—"}
                          </td>
                          <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                            {ev.details || "—"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="py-10 text-center text-slate-500 text-xs"
                        >
                          No events recorded for this session yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Incident Review (Feature 4 — fresh fetch on open)
      ════════════════════════════════════════════════════════════════════════ */}
      {reviewingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/7">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-400" size={14} />
                Violation Incident Review
              </h3>
              <button
                type="button"
                onClick={() => setReviewingIncident(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            {modalLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Fetching latest violation data…
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div className="bg-[#090a0f] p-3 rounded-lg border border-white/5 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student Candidate:</span>
                    <span className="font-semibold text-white">
                      {reviewingIncident.student}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Exam Assessment:</span>
                    <span className="text-slate-300">
                      {reviewingIncident.exam}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Detected At:</span>
                    <span className="font-mono text-slate-400">
                      {reviewingIncident.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Severity Level:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        reviewingIncident.severity === "Critical" ||
                        reviewingIncident.severity === "High"
                          ? "bg-rose-500/10 text-rose-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {reviewingIncident.severity}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1 font-medium">
                    Violation Type
                  </span>
                  <div className="bg-[#090a0f] p-3 rounded-lg border border-white/6 text-slate-200 leading-relaxed">
                    {reviewingIncident.issue}
                  </div>
                </div>

                {reviewingIncident.details && (
                  <div>
                    <span className="text-slate-400 block mb-1 font-medium">
                      Details
                    </span>
                    <div className="bg-[#090a0f] p-3 rounded-lg border border-white/6 text-slate-300 leading-relaxed">
                      {reviewingIncident.details}
                    </div>
                  </div>
                )}

                {reviewingIncident.hasEvidence && (
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Evidence snapshot</p>
                    <EvidenceImage violationId={reviewingIncident.rawId} className="w-full max-h-64 object-contain bg-black" />
                  </div>
                )}

                {reviewingIncident.reviewed && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg">
                    <FaCheckCircle size={12} />
                    <span>
                      {reviewingIncident.reviewOutcome === "DISMISSED"
                        ? "Reviewed — dismissed as a false positive (does not affect the trust score)."
                        : "Reviewed — confirmed by an invigilator."}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-white/7 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingIncident(null)}
                className="px-4 py-2 rounded-lg border border-white/8 text-xs text-slate-300 hover:text-white"
              >
                Close
              </button>

              {!reviewingIncident.reviewed && !modalLoading && (
                <>
                  <button
                    type="button"
                    onClick={() => handleMarkReviewed("DISMISSED")}
                    disabled={reviewing}
                    className="px-4 py-2 rounded-lg border border-white/12 hover:bg-white/5 disabled:opacity-50 text-slate-200 text-xs font-semibold"
                  >
                    Dismiss (false positive)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkReviewed("CONFIRMED")}
                    disabled={reviewing}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <FaCheckCircle size={12} />
                    {reviewing ? "Saving…" : "Confirm violation"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Report Violation (Feature 3)
      ════════════════════════════════════════════════════════════════════════ */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121520] border border-white/10 rounded-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-white/7">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FaPlus className="text-blue-400" size={13} />
                Report Violation
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportForm({
                    sessionId: "",
                    type: "",
                    severity: "",
                    details: "",
                  });
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <FaTimes size={13} />
              </button>
            </div>

            <form onSubmit={handleReportViolation} className="space-y-4">
              {/* Session selector */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Session <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={reportForm.sessionId}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      sessionId: e.target.value,
                    }))
                  }
                  className="w-full bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">— Select a live session —</option>
                  {liveSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.studentName || s.examTitle || `Session #${s.id}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Violation Type */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Violation Type <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={reportForm.type}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="w-full bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">— Select type —</option>
                  <option value="NO_FACE_DETECTED">NO_FACE_DETECTED</option>
                  <option value="MULTIPLE_FACES_DETECTED">
                    MULTIPLE_FACES_DETECTED
                  </option>
                  <option value="LOOKING_AWAY">LOOKING_AWAY</option>
                  <option value="UNAUTHORIZED_OBJECT">UNAUTHORIZED_OBJECT</option>
                  <option value="IDENTITY_MISMATCH">IDENTITY_MISMATCH</option>
                </select>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Severity <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={reportForm.severity}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                  className="w-full bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">— Select severity —</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              {/* Details (optional) */}
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1.5">
                  Details{" "}
                  <span className="text-slate-600 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={reportForm.details}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      details: e.target.value,
                    }))
                  }
                  placeholder="Additional context or observations…"
                  className="w-full bg-[#090a0f] border border-white/8 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportForm({
                      sessionId: "",
                      type: "",
                      severity: "",
                      details: "",
                    });
                  }}
                  className="px-4 py-2 rounded-lg border border-white/8 text-xs text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submittingReport ||
                    !reportForm.sessionId ||
                    !reportForm.type ||
                    !reportForm.severity
                  }
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <FaPlus size={11} />
                  {submittingReport ? "Submitting…" : "Submit Violation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
