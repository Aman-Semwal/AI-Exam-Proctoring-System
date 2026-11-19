import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FaCamera, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import WebcamCard from "../../components/exam/WebcamCard";
import QuestionPanel from "../../components/exam/QuestionPanel";
import ExamTimer from "../../components/exam/ExamTimer";
import AIStatus from "../../components/exam/AIStatus";
import SubmitCard from "../../components/exam/SubmitCard";
import SystemCheck from "../../components/exam/setup/SystemCheck";
import ConsentStep from "../../components/exam/setup/ConsentStep";
import ScreenShareStep from "../../components/exam/setup/ScreenShareStep";

import api from "../../services/api";
import useWebSocket from "../../services/useWebSocket";
import { DEFAULT_PROCTORING_RULES } from "../../utils/proctoringRules";
import { requestEntireScreen } from "../../utils/screenShare";
import useClipboardGuard from "../../hooks/useClipboardGuard";

// Minimum gap between two reports of the same browser event type
const EVENT_DEBOUNCE_MS = 3000;
// Longest we wait for pending answers to save before submitting anyway
const FLUSH_TIMEOUT_MS = 3000;

// One numbered step of the pre-exam setup. Locked steps are shown dimmed without content.
const SetupStep = ({ n, title, done, locked = false, children }) => (
  <li
    className={`border rounded-xl p-4 transition ${
      done ? "border-emerald-500/30 bg-emerald-500/5" : locked ? "border-white/5 opacity-50" : "border-white/10 bg-white/2"
    }`}
  >
    <div className="flex items-center gap-3 mb-2">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
          done ? "bg-emerald-500 text-white" : "bg-white/10 text-slate-300"
        }`}
      >
        {done ? <FaCheckCircle size={12} /> : n}
      </span>
      <span className="text-sm font-semibold text-white">{title}</span>
    </div>
    {!locked && !done && children}
    {done && n === 3 && children}
  </li>
);

const LiveExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const examId = searchParams.get("examId");
  const existingSessionId = searchParams.get("sessionId");

  // Flow states
  // "resuming" checks an existing session first: it must still be active and must
  // already have its reference photo — otherwise a reload would skip identity checks.
  const [step, setStep] = useState(existingSessionId ? "resuming" : "setup");
  // Base64 JPEG (no data-URI prefix) of the live reference photo
  const [photo, setPhoto] = useState(null);
  const photoTaken = !!photo;
  const [cameraStream, setCameraStream] = useState(null);
  const [camError, setCamError] = useState("");
  const [setupError, setSetupError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const setupVideoRef = useRef(null);

  // Exam states
  const [sessionId, setSessionId] = useState(existingSessionId);
  const [examTitle, setExamTitle] = useState("Proctored Exam");
  const [rules, setRules] = useState(DEFAULT_PROCTORING_RULES);
  // What a resumed session already has, so setup doesn't ask for it twice
  const [resumeInfo, setResumeInfo] = useState({ consentGiven: false, referenceEnrolled: false, resumed: false });
  // A reload drops the screen share: the gap until it is shared again is recorded as a
  // SCREEN_SHARE_STOPPED violation with its time away, so the proctor sees it
  const resumeGapRef = useRef(null);
  const photoRequired = rules.identityCheckEnabled && !resumeInfo.referenceEnrolled;
  const consentRequired = !resumeInfo.consentGiven;
  const screenRequired = rules.screenMonitoringEnabled;

  // Pre-exam steps: 1 system check → 2 consent → 3 entire-screen share → 4 photo
  const [systemOk, setSystemOk] = useState(false);
  const [consented, setConsented] = useState(false);
  // Kept for the whole exam: screenshots are taken from it (see WebcamCard)
  const [screenStream, setScreenStream] = useState(null);
  const screenStreamRef = useRef(null);
  const consentDone = consented || !consentRequired;
  const screenDone = !screenRequired || screenStream?.getVideoTracks()[0]?.readyState === "live";

  // Lockdown state
  const [tabWarnings, setTabWarnings] = useState(0);
  // Initialised from the document so a reload (which drops fullscreen) shows the overlay
  // without recording a violation — only a fullscreenchange event records one.
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  // Live messages from the proctor (warnings) or the system (termination)
  const [proctorWarning, setProctorWarning] = useState("");
  // The student's own recorded browser events — nothing is hidden from them
  const [myEvents, setMyEvents] = useState([]);
  const [terminatedNotice, setTerminatedNotice] = useState("");
  // The student stopped sharing their screen; the exam is blocked until they resume
  const [screenStopped, setScreenStopped] = useState(false);
  const [screenResumeError, setScreenResumeError] = useState("");
  const [clipboardToast, setClipboardToast] = useState(false);
  // Set by the lockdown effect so other handlers can report events through the same path
  const reportEventRef = useRef(null);
  const finishAwayRef = useRef(null);

  // Pending answers live in QuestionPanel; flush them before anything ends the session
  const answerSyncRef = useRef(null);
  const flushAnswers = useCallback(
    () =>
      Promise.race([
        answerSyncRef.current?.flush() ?? Promise.resolve(),
        new Promise((resolve) => setTimeout(resolve, FLUSH_TIMEOUT_MS)),
      ]),
    []
  );

  // 0. Resume an existing session
  useEffect(() => {
    if (step !== "resuming") return;

    api.get(`/sessions/${existingSessionId}`)
      .then((res) => {
        const session = res.data?.data;
        if (session?.status !== "ACTIVE") {
          navigate(`/student/results?sessionId=${existingSessionId}`, { replace: true });
          return;
        }
        if (session.examTitle) setExamTitle(session.examTitle);
        return api.get(`/exams/${session.examId}`).then((examRes) => {
          const examRules = { ...DEFAULT_PROCTORING_RULES, ...examRes.data?.data?.proctoringRules };
          setRules(examRules);
          setResumeInfo({
            consentGiven: !!session.consentGiven,
            referenceEnrolled: !!session.referenceEnrolled,
            resumed: true,
          });
          // The checks already passed when this session started — don't repeat them
          setSystemOk(true);
          // Guarded: React StrictMode runs this effect twice in dev — record the gap once
          if (examRules.screenMonitoringEnabled && !resumeGapRef.current) {
            const leftAt = Date.now();
            resumeGapRef.current = { violationId: null, leftAt };
            api
              .post(`/proctor/session/${existingSessionId}/browser-event`, {
                type: "SCREEN_SHARE_STOPPED",
                signal: "SCREEN_SHARE_ENDED",
              })
              .then((r) => {
                if (resumeGapRef.current) resumeGapRef.current.violationId = r.data?.data?.violationId;
              })
              .catch((err) => console.warn("Could not record the reload gap:", err?.response?.data?.message || err.message));
          }
          const needsPhoto = examRules.identityCheckEnabled && !session.referenceEnrolled;
          // A reload drops the screen share, so it must be asked for again
          const needsSetup = needsPhoto || !session.consentGiven || examRules.screenMonitoringEnabled;
          setStep(needsSetup ? "setup" : "active_exam");
        });
      })
      .catch((err) => {
        console.error("Failed to load session:", err);
        setSetupError(err.response?.data?.message || "Unable to load your exam session.");
        setStep("setup");
      });
  }, [step, existingSessionId, navigate]);

  // Load the exam's proctoring rules for a fresh start
  useEffect(() => {
    if (existingSessionId || !examId) return;
    api.get(`/exams/${examId}`)
      .then((res) => {
        const exam = res.data?.data;
        if (exam?.title) setExamTitle(exam.title);
        setRules({ ...DEFAULT_PROCTORING_RULES, ...exam?.proctoringRules });
      })
      .catch((err) => console.warn("Could not load exam rules, using defaults:", err.message));
  }, [examId, existingSessionId]);

  // Track fullscreen at all times — entering fullscreen happens during the start click,
  // before the lockdown listeners below are attached.
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  // 1. Setup Camera
  useEffect(() => {
    // Tracked locally — the cleanup's closure would only ever see the initial null state
    let setupStream = null;
    let cancelled = false;

    if (step === "setup") {
      // Ask for the mic here too, so its permission prompt can't appear mid-exam
      // (a prompt steals focus and would count as leaving the exam window)
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true }))
        .then((stream) => {
          // Left the setup step before the camera came up — release it right away
          if (cancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          // Only the camera preview is needed here; the mic was requested for permission
          stream.getAudioTracks().forEach((track) => track.stop());
          setupStream = stream;
          setCameraStream(stream);
          if (setupVideoRef.current) {
            setupVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          setCamError("Camera access is required to start the exam. Please allow camera permissions.");
        });
    }

    return () => {
      cancelled = true;
      if (setupStream) {
        setupStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step]);

  // 2. Create the exam session (once — a failed enrollment retry reuses it)
  const ensureSession = async () => {
    if (sessionId) return sessionId;

    let response;
    try {
      response = await api.post("/sessions/start", { examId: Number(examId) });
    } catch (err) {
      // Left mid-exam and came back from the dashboard: continue that session
      if (err.response?.data?.message?.includes("active session already exists")) {
        const mine = (await api.get("/sessions/my")).data?.data || [];
        const running = mine.find((s) => String(s.examId) === String(examId) && s.status === "ACTIVE");
        if (running) {
          setSessionId(String(running.id));
          if (running.examTitle) setExamTitle(running.examTitle);
          return String(running.id);
        }
      }
      throw err;
    }

    const sessionData = response.data?.data;
    if (!sessionData?.id) throw new Error("Session ID was not returned by the server.");

    const newSessionId = String(sessionData.id);
    setSessionId(newSessionId);
    if (sessionData.examTitle) setExamTitle(sessionData.examTitle);
    return newSessionId;
  };

  // 3. Browser lockdown: tab switches / leaving the window / exiting fullscreen.
  // Each is recorded server-side; the server decides when to auto-submit.
  const lastEventAt = useRef({});
  const snapshotRef = useRef(null);
  // type → { violationId, leftAt, returnedAt, hidden, done } for the absence in progress
  const awayRef = useRef({});

  useEffect(() => {
    if (step !== "active_exam" || !sessionId) return;

    const sendReturn = (entry) => {
      if (entry.done || !entry.violationId || !entry.returnedAt) return;
      entry.done = true;
      const awaySeconds = Math.max(0, Math.round((entry.returnedAt - entry.leftAt) / 1000));
      setMyEvents((prev) => prev.map((e) => (e.violationId === entry.violationId ? { ...e, awaySeconds } : e)));
      api
        .post(`/proctor/session/${sessionId}/browser-event/${entry.violationId}/return`, {
          awaySeconds,
          tabHidden: entry.hidden,
        })
        .catch((err) => console.warn("Failed to record return:", err?.response?.data?.message || err.message));
    };

    const finishAway = (type) => {
      const entry = awayRef.current[type];
      if (!entry || entry.returnedAt) return;
      entry.returnedAt = Date.now();
      sendReturn(entry); // waits for the violation id if the report is still in flight
    };

    const reportEvent = async (type, signal) => {
      // Copy/paste attempts: the student never leaves, so no time away is tracked
      const tracksAway = type !== "COPY_PASTE_ATTEMPT";
      const pending = tracksAway ? awayRef.current[type] : null;
      if (pending && !pending.returnedAt) {
        // Same absence, another signal (blur then tab hidden) — remember it, don't count twice
        if (signal === "TAB_HIDDEN") pending.hidden = true;
        return;
      }
      // visibilitychange + blur both fire for a single switch — count it once
      const now = Date.now();
      if (now - (lastEventAt.current[type] || 0) < EVENT_DEBOUNCE_MS) return;
      lastEventAt.current[type] = now;

      // Grab the frame now, before any await: it shows the moment the student left
      const snapshotBase64 = snapshotRef.current?.capture() ?? undefined;
      const screenBase64 = snapshotRef.current?.captureScreen?.() ?? undefined;
      const entry = { violationId: null, leftAt: now, returnedAt: null, hidden: signal === "TAB_HIDDEN", done: false };
      if (tracksAway) awayRef.current[type] = entry;

      try {
        if (type === "TAB_SWITCH") await flushAnswers();
        const res = await api.post(`/proctor/session/${sessionId}/browser-event`, {
          type,
          signal,
          snapshotBase64,
          screenBase64,
        });
        const result = res.data?.data;
        entry.violationId = result?.violationId ?? null;
        if (entry.violationId) {
          setMyEvents((prev) => [...prev, { violationId: entry.violationId, type, at: now, awaySeconds: null }]);
        }
        if (tracksAway) sendReturn(entry); // the student may already be back
        if (type === "TAB_SWITCH" && result) setTabWarnings(result.tabSwitchCount);
        if (result?.autoSubmitted) {
          // This page unmounts; still record the time away when the student comes back
          const onBack = () => {
            if (document.hidden) return;
            window.removeEventListener("focus", onBack);
            document.removeEventListener("visibilitychange", onBack);
            finishAway(type);
          };
          window.addEventListener("focus", onBack);
          document.addEventListener("visibilitychange", onBack);
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          navigate(`/student/results?sessionId=${sessionId}`);
        }
      } catch (err) {
        // 409 = session already ended (e.g. submitted or terminated) — go to results
        if (err.response?.status === 409) {
          navigate(`/student/results?sessionId=${sessionId}`);
          return;
        }
        console.warn("Failed to record browser event:", err?.response?.data?.message || err.message);
      }
    };

    reportEventRef.current = reportEvent;
    finishAwayRef.current = finishAway;

    const handleVisibilityChange = () => {
      if (document.hidden) reportEvent("TAB_SWITCH", "TAB_HIDDEN");
      else finishAway("TAB_SWITCH");
    };
    const handleBlur = () => reportEvent("TAB_SWITCH", "WINDOW_BLUR");
    const handleFocus = () => finishAway("TAB_SWITCH");
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) reportEvent("FULLSCREEN_EXIT", "FULLSCREEN_EXIT");
      else finishAway("FULLSCREEN_EXIT");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      reportEventRef.current = null;
      finishAwayRef.current = null;
    };
  }, [step, sessionId, navigate, flushAnswers]);

  // 3b. Copy, paste, right-click and blocked shortcuts — blocked, shown, recorded
  const clipboardToastTimer = useRef(null);
  useClipboardGuard({
    enabled: step === "active_exam" && rules.clipboardBlockingEnabled,
    onBlocked: (signal) => {
      setClipboardToast(true);
      clearTimeout(clipboardToastTimer.current);
      clipboardToastTimer.current = setTimeout(() => setClipboardToast(false), 2000);
      reportEventRef.current?.("COPY_PASTE_ATTEMPT", signal);
    },
  });

  // 3c. The student stops sharing their screen → record it and block the exam
  useEffect(() => {
    if (step !== "active_exam" || !screenStream) return;
    const track = screenStream.getVideoTracks()[0];
    if (!track) return;
    const onEnded = () => {
      setScreenStopped(true);
      reportEventRef.current?.("SCREEN_SHARE_STOPPED", "SCREEN_SHARE_ENDED");
    };
    // Already ended before the exam page attached (e.g. stopped right at Start)
    if (track.readyState === "ended") {
      onEnded();
      return;
    }
    track.addEventListener("ended", onEnded);
    // Removed before the tracks are stopped on unmount/submit, so ending the exam
    // never reports a stopped share (stop() itself does not fire "ended" either)
    return () => track.removeEventListener("ended", onEnded);
  }, [step, screenStream]);

  // Release the screen share when the page goes away (submit, results, navigation)
  useEffect(
    () => () => {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (import.meta.env.DEV) delete window.__proctorScreenStream;
    },
    []
  );

  const resumeScreenShare = async () => {
    setScreenResumeError("");
    try {
      const stream = await requestEntireScreen();
      handleScreenShared(stream);
      setScreenStopped(false);
      finishAwayRef.current?.("SCREEN_SHARE_STOPPED");
    } catch (err) {
      setScreenResumeError(err.message);
    }
  };

  // Time is up: save what's pending, submit, and show results. The server may already
  // have expired the session (it checks every 30 s) — results are shown either way.
  const handleTimeExpired = useCallback(async () => {
    await flushAnswers();
    try {
      await api.put(`/sessions/${sessionId}/end`);
    } catch (err) {
      console.warn("Time-up submit:", err?.response?.data?.message || err.message);
    }
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate(`/student/results?sessionId=${sessionId}`, { replace: true });
  }, [flushAnswers, sessionId, navigate]);

  // The server ended the session (auto-terminate, expiry, or a proctor) — show the result
  const handleSessionEnded = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate(`/student/results?sessionId=${sessionId}`, { replace: true });
  }, [sessionId, navigate]);

  useWebSocket({
    userQueue: "/user/queue/session-events",
    enabled: step === "active_exam" && !!sessionId,
    onUserMessage: (msg) => {
      if (String(msg.sessionId) !== String(sessionId)) return;
      if (msg.eventType === "PROCTOR_WARNING") setProctorWarning(msg.details || "Please follow the exam rules.");
      if (msg.eventType === "SESSION_TERMINATED") {
        setTerminatedNotice(msg.details || "Your exam session has been terminated.");
        setTimeout(handleSessionEnded, 4000);
      }
    },
  });

  const returnToFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch((err) => {
      console.warn("Fullscreen request failed:", err);
    });
  };

  const capturePhoto = () => {
    const video = setupVideoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhoto(dataUrl.replace(/^data:image\/jpeg;base64,/, ""));
    setSetupError("");
  };

  const handleScreenShared = (stream) => {
    screenStreamRef.current = stream;
    setScreenStream(stream);
    // Lets the e2e test stop the share like a student clicking "Stop sharing"
    if (import.meta.env.DEV) window.__proctorScreenStream = stream;
  };

  const canStart = systemOk && consentDone && screenDone && (!photoRequired || photoTaken);

  // Stopped during setup → reopen the share step (otherwise the exam would start unmonitored)
  useEffect(() => {
    if (step !== "setup" || !screenStream) return;
    const track = screenStream.getVideoTracks()[0];
    const onEnded = () => {
      if (screenStreamRef.current === screenStream) screenStreamRef.current = null;
      setScreenStream(null);
    };
    if (!track || track.readyState === "ended") {
      onEnded();
      return;
    }
    track.addEventListener("ended", onEnded);
    return () => track.removeEventListener("ended", onEnded);
  }, [step, screenStream]);

  const handleStartExam = async () => {
    if (!canStart || enrolling) return;

    if (!examId) {
      setSetupError("Exam ID is missing. Please select an exam first.");
      return;
    }

    // Fullscreen must be requested synchronously within the click, before any await
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
    }

    setEnrolling(true);
    setSetupError("");

    try {
      const activeSessionId = await ensureSession();

      // Nothing is captured server-side until consent is recorded (idempotent)
      await api.post(`/sessions/${activeSessionId}/consent`);

      if (photoRequired) {
        try {
          await api.post(`/proctor/session/${activeSessionId}/reference`, {
            imageBase64: photo,
          });
        } catch (err) {
          // 409 = already enrolled (e.g. retry after a network blip) — safe to continue
          if (err.response?.status !== 409) throw err;
        }
      }

      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      const gap = resumeGapRef.current;
      if (gap?.violationId) {
        resumeGapRef.current = null;
        api
          .post(`/proctor/session/${activeSessionId}/browser-event/${gap.violationId}/return`, {
            awaySeconds: Math.max(0, Math.round((Date.now() - gap.leftAt) / 1000)),
            tabHidden: false,
          })
          .catch((err) => console.warn("Could not record the reload gap:", err?.response?.data?.message || err.message));
      }

      navigate(`/student/live-exam?examId=${examId}&sessionId=${activeSessionId}`, { replace: true });
      setStep("active_exam");
    } catch (err) {
      console.error("Failed to start exam:", err);
      if (err.response?.status === 400) setPhoto(null); // no face — force a retake
      if (err.response?.status === 403) setConsented(false); // consent missing — ask again
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setSetupError(err.response?.data?.message || "Unable to start the exam. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  // --- RENDER METHODS ---

  if (step === "resuming") {
    return (
      <div className="flex bg-[#090a0f] min-h-screen text-slate-100 items-center justify-center p-6">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Resuming your exam session...</p>
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="flex bg-[#090a0f] min-h-screen text-slate-100 items-center justify-center p-6">
        <div className="bg-[#121520] border border-white/7 rounded-2xl p-8 max-w-2xl w-full text-center shadow-xl">
          <h1 className="text-2xl font-bold text-white mb-2">Pre-Exam Setup</h1>
          <p className="text-slate-400 mb-6 text-sm">Complete each step to start your proctored exam.</p>

          {camError ? (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center justify-center gap-3 mb-6">
              <FaExclamationTriangle />
              <span>{camError}</span>
            </div>
          ) : (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-white/10 mb-6 flex items-center justify-center mx-auto max-w-md">
              <video 
                ref={setupVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className={`w-full h-full object-cover ${photoTaken ? 'opacity-50' : ''}`} 
              />
              {/* Face oval overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                 <div className={`w-40 h-56 border-2 border-dashed rounded-full ${photoTaken ? 'border-emerald-500' : 'border-white/50'}`}></div>
              </div>

              {photoTaken && (
                <>
                  <img
                    src={`data:image/jpeg;base64,${photo}`}
                    alt="Your reference photo"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-emerald-400 bg-black/40">
                    <FaCheckCircle size={40} className="mb-2" />
                    <span className="font-semibold">Photo Captured</span>
                  </div>
                </>
              )}
            </div>
          )}

          <ol className="space-y-3 mb-6 text-left">
            {!resumeInfo.resumed && (
              <SetupStep n={1} title="System check" done={systemOk}>
                <SystemCheck rules={rules} cameraStream={cameraStream} onPassed={setSystemOk} />
              </SetupStep>
            )}
            {consentRequired && (
              <SetupStep n={2} title="Consent" done={consented} locked={!systemOk}>
                <ConsentStep rules={rules} onConsented={() => setConsented(true)} />
              </SetupStep>
            )}
            {screenRequired && (
              <SetupStep n={3} title="Share your screen" done={!!screenStream} locked={!systemOk || !consentDone}>
                <ScreenShareStep stream={screenStream} onShared={handleScreenShared} />
              </SetupStep>
            )}
            <SetupStep
              n={4}
              title={photoRequired ? "Verify identity" : "Start"}
              done={false}
              locked={!systemOk || !consentDone || !screenDone}
            >
              <p className="text-xs text-slate-400">
                {photoRequired
                  ? "Take a verification photo with your face inside the oval, then start."
                  : "You're ready. The exam opens in full screen."}
              </p>
            </SetupStep>
          </ol>

          {setupError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center justify-center gap-3 mb-6 text-sm">
              <FaExclamationTriangle />
              <span>{setupError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {photoRequired && !photoTaken ? (
              <button
                onClick={capturePhoto}
                disabled={!!camError || !cameraStream || !systemOk || !consentDone || !screenDone}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition"
              >
                <FaCamera />
                Take Photo
              </button>
            ) : (
              <>
                {photoTaken && (
                  <button
                    onClick={() => setPhoto(null)}
                    disabled={enrolling}
                    className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition"
                  >
                    Retake Photo
                  </button>
                )}
                <button
                  onClick={handleStartExam}
                  disabled={enrolling || !canStart}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-emerald-500/20 transition"
                >
                  {enrolling ? "Verifying photo..." : "Start Exam (Full Screen)"}
                </button>
              </>
            )}
          </div>

          <div className="mt-8 text-xs text-slate-500 bg-blue-500/5 p-4 rounded-lg border border-blue-500/10 text-left">
            <strong className="text-blue-400 block mb-1">Anti-Cheat Rules Active:</strong>
            <ul className="list-disc pl-4 space-y-1">
              <li>This exam requires <strong>full-screen mode</strong>.</li>
              {rules.screenMonitoringEnabled && (
                <li>Your <strong>entire screen</strong> is shared; stopping the share is recorded.</li>
              )}
              {rules.clipboardBlockingEnabled && (
                <li>Copy, paste, right-click and shortcuts like print or DevTools are blocked and recorded.</li>
              )}
              <li>Your photo is used to verify that the same person takes the whole exam.</li>
              <li>Your webcam feed is continuously monitored by AI for multiple faces, absence, or looking away.</li>
              <li><strong>Do not switch tabs or minimize the browser.</strong> Doing so will result in an automatic submission of your exam!</li>
            </ul>
          </div>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-white/6">
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

          {proctorWarning && (
            <div className="flex items-start gap-3 bg-amber-500/15 border border-amber-500/30 text-amber-200 px-4 py-3 rounded-xl text-sm mb-6">
              <FaExclamationTriangle className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block text-amber-300">Message from your proctor</strong>
                {proctorWarning}
              </div>
              <button
                type="button"
                onClick={() => setProctorWarning("")}
                className="text-amber-300 hover:text-white text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {tabWarnings > 0 && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-3 rounded-xl text-sm mb-6">
              <FaExclamationTriangle className="shrink-0" />
              <span>
                {tabWarnings} tab switch{tabWarnings > 1 ? "es" : ""} recorded — your proctor has been notified.
                {rules.tabSwitchLimit > 0 &&
                  ` Your exam is submitted automatically after ${rules.tabSwitchLimit} switches.`}
              </span>
            </div>
          )}

          {myEvents.length > 0 && (
            <div className="bg-white/2 border border-white/6 rounded-xl px-4 py-3 mb-6 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Recorded on your exam (visible to your proctor):</p>
              <ul className="space-y-0.5">
                {myEvents.map((e, i) => (
                  <li key={e.violationId ?? i}>
                    • {e.type === "TAB_SWITCH" ? "Left the exam window" : "Exited full screen"} at{" "}
                    {new Date(e.at).toLocaleTimeString()}
                    {e.awaySeconds != null ? ` — away ${e.awaySeconds} s` : " — away…"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Exam Workspace */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Questions */}
            <div className="lg:col-span-8">
              <QuestionPanel sessionId={sessionId} answerSyncRef={answerSyncRef} />
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-4 space-y-4">
              <ExamTimer sessionId={sessionId} onTimeExpired={handleTimeExpired} />

              <WebcamCard
                sessionId={sessionId}
                audioEnabled={rules.audioMonitoringEnabled}
                onSessionEnded={handleSessionEnded}
                snapshotRef={snapshotRef}
                screenStream={screenStream}
              />

              <AIStatus sessionId={sessionId} tabSwitches={tabWarnings} tabSwitchLimit={rules.tabSwitchLimit} />

              <SubmitCard sessionId={sessionId} beforeSubmit={flushAnswers} />
            </div>
          </div>
        </main>
      </div>

      {terminatedNotice && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-6">
          <div className="bg-[#121520] border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center">
            <FaExclamationTriangle size={36} className="text-rose-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white">Exam terminated</h2>
            <p className="text-sm text-slate-400 mt-2">{terminatedNotice}</p>
            <p className="text-xs text-slate-500 mt-4">Taking you to your results…</p>
          </div>
        </div>
      )}

      {clipboardToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-lg">
          Copy and paste are disabled during the exam
        </div>
      )}

      {screenStopped && !terminatedNotice && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#121520] border border-rose-500/20 rounded-2xl p-8 max-w-md w-full text-center">
            <FaExclamationTriangle size={36} className="text-rose-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white">Screen sharing stopped</h2>
            <p className="text-sm text-slate-400 mt-2">
              Screen sharing stopped. Resume sharing to continue. This has been recorded and reported to your proctor.
            </p>
            {screenResumeError && <p className="text-xs text-rose-400 mt-3">{screenResumeError}</p>}
            <button
              onClick={resumeScreenShare}
              className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Resume sharing
            </button>
          </div>
        </div>
      )}

      {!isFullscreen && !terminatedNotice && !screenStopped && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#121520] border border-amber-500/20 rounded-2xl p-8 max-w-md w-full text-center">
            <FaExclamationTriangle size={36} className="text-amber-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white">Full-screen mode required</h2>
            <p className="text-sm text-slate-400 mt-2">
              This exam must be taken in full-screen mode. Leaving full screen is recorded and
              reported to your proctor.
            </p>
            <button
              onClick={returnToFullscreen}
              className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-semibold transition"
            >
              Return to full screen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveExam;
