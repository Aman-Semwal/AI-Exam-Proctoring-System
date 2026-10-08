import { useEffect, useRef, useState, useCallback } from "react";
import { FaCamera, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import api from "../../services/api";
import { createAudioRecorder } from "../../utils/audioRecorder";

// Capture and POST a frame every FRAME_INTERVAL_MS milliseconds.
// 5 s is a reasonable default — frequent enough to catch violations,
// infrequent enough not to hammer the backend or eat mobile bandwidth.
const FRAME_INTERVAL_MS = 5000;

// JPEG quality for canvas.toDataURL — 0.75 gives a good size/quality tradeoff
const JPEG_QUALITY = 0.75;

// Frames are scaled down to this width at most (~30–50 KB) — enough for the AI and evidence
const MAX_FRAME_WIDTH = 640;

/**
 * WebcamCard
 *
 * - Requests the user's camera via getUserMedia.
 * - Renders a live <video> preview with a face-detection HUD overlay.
 * - Every FRAME_INTERVAL_MS ms it captures a frame into an off-screen
 *   <canvas>, base64-encodes it, and POSTs it to POST /api/proctor/frame
 *   along with the current sessionId.
 * - Displays the latest AI verdict (violations / clean frame) inline.
 *
 * Props:
 *   sessionId {string|number} — required; the active exam session ID.
 *   audioEnabled {boolean} — also record the mic and send each interval's audio with the frame.
 *   onSessionEnded {() => void} — called when the server reports the session is no longer active
 *                                  (auto-terminated, submitted elsewhere, or expired).
 *   snapshotRef {Ref} — receives { capture() } → base64 JPEG of the current frame (or null),
 *                       used as evidence when the student leaves the exam window.
 */
const WebcamCard = ({ sessionId, audioEnabled = false, onSessionEnded, snapshotRef }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const configErrorLoggedRef = useRef(false);
  const recorderRef = useRef(null);

  const [camState, setCamState] = useState("idle"); // idle | loading | active | denied | error
  const [configError, setConfigError] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);   // null | "clean" | "violation"
  const [lastViolations, setLastViolations] = useState([]);
  const [frameCount, setFrameCount] = useState(0);
  const [micState, setMicState] = useState("off"); // off | active | denied

  // ─── Start webcam ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setCamState("loading");
    const video = { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" };
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: audioEnabled });
      } catch (err) {
        // A missing or blocked mic must not stop the exam — fall back to video only
        if (!audioEnabled) throw err;
        console.warn("Microphone unavailable, continuing with video only:", err.name);
        setMicState("denied");
        stream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      }
      streamRef.current = stream;
      if (stream.getAudioTracks().length > 0) {
        recorderRef.current?.stop();
        recorderRef.current = createAudioRecorder(stream);
        setMicState("active");
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamState("active");
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamState("denied");
      } else {
        console.error("Camera error:", err);
        setCamState("error");
      }
    }
  }, [audioEnabled]);

  // ─── Capture one frame and POST to backend ─────────────────────────────────
  const captureAndPostFrame = useCallback(async () => {
    if (!sessionId || String(sessionId).trim() === "") {
      setConfigError(true);
      if (!configErrorLoggedRef.current) {
        console.error("Webcam configuration error: sessionId is missing.");
        configErrorLoggedRef.current = true;
      }
      return;
    }

    setConfigError(false);

    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Video must be playing and have real dimensions
    if (video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) return;

    const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Strip the data URI prefix — backend expects raw base64
    const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
    const frameBase64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");

    try {
      const audioBase64 = recorderRef.current?.takeChunk() ?? undefined;
      const response = await api.post("/proctor/frame", {
        sessionId: Number(sessionId),
        frameBase64,
        audioBase64,
      });

      const event = response.data?.data;
      const violations = event?.violationsDetected ?? [];
      if (event?.sessionStatus && event.sessionStatus !== "ACTIVE") {
        onSessionEnded?.();
        return;
      }

      setLastViolations(violations);
      setAiStatus(violations.length > 0 ? "violation" : "clean");
      setFrameCount((c) => c + 1);
    } catch (err) {
      // 409 = the session is no longer active (terminated, submitted or expired)
      if (err.response?.status === 409) {
        onSessionEnded?.();
        return;
      }
      // Otherwise non-fatal — a transient failure shouldn't crash the exam.
      console.warn("Frame POST failed:", err?.response?.data?.message || err.message);
    }
  }, [sessionId, onSessionEnded]);

  // ─── Snapshot on demand (evidence for tab switches / full-screen exits) ────
  useEffect(() => {
    if (!snapshotRef) return;
    snapshotRef.current = {
      capture: () => {
        const video = videoRef.current;
        if (!video || video.readyState < video.HAVE_CURRENT_DATA || video.videoWidth === 0) return null;
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth);
        canvas.width = Math.round(video.videoWidth * scale);
        canvas.height = Math.round(video.videoHeight * scale);
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", JPEG_QUALITY).replace(/^data:image\/jpeg;base64,/, "");
      },
    };
  }, [snapshotRef]);

  // ─── Lifecycle: mount → start camera; unmount → stop ──────────────────────
  useEffect(() => {
    startCamera();

    return () => {
      // Stop all tracks so the browser turns off the camera indicator light
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      recorderRef.current?.stop();
      recorderRef.current = null;
      clearInterval(intervalRef.current);
    };
  }, [startCamera]);

  // ─── Start/stop frame interval when camera becomes active ─────────────────
  useEffect(() => {
    if (camState === "active" && !configError) {
      intervalRef.current = setInterval(captureAndPostFrame, FRAME_INTERVAL_MS);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [camState, configError, captureAndPostFrame]);

  // ─── Derived status label ──────────────────────────────────────────────────
  const statusLabel = () => {
    if (configError) return { text: "Session configuration missing", color: "text-red-400" };
    if (camState === "loading") return { text: "Initializing camera...", color: "text-slate-400" };
    if (camState === "denied")  return { text: "Camera access denied", color: "text-red-400" };
    if (camState === "error")   return { text: "Camera error", color: "text-red-400" };
    if (aiStatus === "violation") return { text: "Violation detected", color: "text-red-400" };
    if (aiStatus === "clean")   return { text: "Feed Clear", color: "text-emerald-400" };
    return { text: "Camera Connected", color: "text-emerald-400" };
  };

  const status = statusLabel();

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white tracking-tight">
          Live Proctored Feed
        </h2>

        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
          camState === "active" && !configError
            ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
            : "text-red-400 bg-red-500/10 border border-red-500/20"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            camState === "active" && !configError ? "bg-emerald-400 animate-pulse" : "bg-red-400"
          }`} />
          {camState === "active" && !configError ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      {/* Camera Preview */}
      <div className="relative h-48 rounded-lg bg-[#090a0f] border border-white/8 overflow-hidden">
        {/* Live video — hidden until active to avoid blank flash */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${camState === "active" ? "block" : "hidden"}`}
        />

        {/* HUD overlay (shown when cam is active) */}
        {camState === "active" && !configError && (
          <div className="absolute inset-x-8 inset-y-6 border border-blue-500/30 rounded-lg pointer-events-none flex items-start justify-between p-2">
            <span className="text-[9px] font-mono text-blue-400/80 bg-blue-500/10 px-1 rounded">
              FRAMES: {frameCount}
            </span>
            {aiStatus === "violation" ? (
              <span className="text-[9px] font-mono text-red-400/90 bg-red-500/10 px-1 rounded">
                ⚠ VIOLATION
              </span>
            ) : (
              <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1 rounded">
                AI: MONITORING
              </span>
            )}
          </div>
        )}

        {/* Placeholder when camera is not active */}
        {camState !== "active" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-10 px-4">
            <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/8 flex items-center justify-center text-slate-400 mx-auto mb-2">
              {camState === "denied" || camState === "error"
                ? <FaExclamationTriangle size={20} className="text-red-400" />
                : <FaCamera size={20} />}
            </div>

            <p className="text-xs text-slate-400 font-medium">
              {camState === "loading" && "Starting camera..."}
              {camState === "denied"  && "Allow camera access in browser settings"}
              {camState === "error"   && "Could not open camera"}
              {camState === "idle"    && "Candidate Feed Stream"}
            </p>
          </div>
        )}

        {configError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-950/30 px-4 text-center z-10">
            <p className="text-xs font-medium text-red-300">
              Unable to monitor this exam because the session ID is missing.
            </p>
          </div>
        )}
      </div>

      {/* Violations list (only when there are active ones) */}
      {lastViolations.length > 0 && (
        <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">
            Violations Detected
          </p>
          <ul className="space-y-0.5">
            {lastViolations.map((v, i) => (
              <li key={i} className="text-[11px] text-red-300 font-mono">
                • {v.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {audioEnabled && (
        <p className={`mt-3 text-[11px] ${micState === "denied" ? "text-amber-400" : "text-slate-500"}`}>
          {micState === "active" && "🎙 Microphone monitored — speech is flagged to your proctor"}
          {micState === "denied" && "⚠ Microphone unavailable — continuing with video monitoring only"}
        </p>
      )}

      {/* Footer status + retry */}
      <div className="mt-4 flex justify-between items-center text-xs">
        <span className={`flex items-center gap-1.5 text-[11px] font-medium ${status.color}`}>
          {configError || aiStatus === "violation"
            ? <FaExclamationTriangle size={11} />
            : <FaCheckCircle size={11} />}
          {status.text}
        </span>

        {(camState === "denied" || camState === "error") && (
          <button
            onClick={startCamera}
            className="bg-[#090a0f] hover:bg-white/4 border border-white/8 text-slate-200 px-3 py-1.5 rounded-md text-[11px] font-medium transition"
          >
            Retry Camera
          </button>
        )}
      </div>

      {/* Off-screen canvas used for frame capture — never rendered visibly */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default WebcamCard;
