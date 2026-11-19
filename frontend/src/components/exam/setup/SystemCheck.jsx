import { useCallback, useEffect, useState } from "react";
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaRedo } from "react-icons/fa";

import api from "../../../services/api";
import { checkBrowser, checkCamera, checkMicLevel, checkNetwork, checkSpeed } from "../../../utils/systemCheck";

// status: "pending" | "running" | "ok" | "warn" | "fail"
const Row = ({ label, status, note }) => (
  <div className="flex items-center justify-between gap-3 py-1.5">
    <span className="text-sm text-slate-300">{label}</span>
    <span className="flex items-center gap-2 text-xs">
      {note && <span className="text-slate-500">{note}</span>}
      {status === "ok" && <FaCheckCircle className="text-emerald-400" />}
      {status === "warn" && <FaExclamationTriangle className="text-amber-400" />}
      {status === "fail" && <FaTimesCircle className="text-rose-400" />}
      {(status === "running" || status === "pending") && (
        <span className="w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      )}
    </span>
  </div>
);

/**
 * Step 1 of the pre-exam setup: camera, microphone (only when audio monitoring is on),
 * network and browser. Calls onPassed(true) when every blocking check passes.
 */
const SystemCheck = ({ rules, cameraStream, onPassed }) => {
  const [results, setResults] = useState({});
  const [micLevel, setMicLevel] = useState(0);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    if (!cameraStream) return;
    setRunning(true);
    onPassed(false);
    const r = {
      camera: "running",
      mic: rules.audioMonitoringEnabled ? "running" : "skip",
      network: "running",
      speed: "running",
      browser: "running",
    };
    setResults({ ...r });

    const browser = checkBrowser({ needScreen: rules.screenMonitoringEnabled });
    r.browser = browser.ok ? "ok" : "fail";
    r.browserNote = browser.message;
    setResults({ ...r });

    r.camera = (await checkCamera(cameraStream)) ? "ok" : "fail";
    setResults({ ...r });

    const net = await checkNetwork(api);
    r.network = net.ok ? "ok" : "warn";
    r.networkNote = net.avgMs != null ? `${net.avgMs} ms` : "unreachable";
    setResults({ ...r });

    const speed = await checkSpeed(api);
    r.speed = speed.ok ? "ok" : "warn";
    r.speedNote = speed.downMbps != null ? `↓ ${speed.downMbps} Mbps · ↑ ${speed.upMbps} Mbps` : "test failed";
    setResults({ ...r });

    if (rules.audioMonitoringEnabled) {
      let micStream;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        r.mic = (await checkMicLevel(micStream, 5000, setMicLevel)) ? "ok" : "fail";
      } catch {
        r.mic = "fail";
      } finally {
        micStream?.getTracks().forEach((t) => t.stop());
      }
      setResults({ ...r });
    }

    setRunning(false);
    onPassed(r.camera === "ok" && r.browser === "ok" && (r.mic === "ok" || r.mic === "skip"));
  }, [cameraStream, rules.audioMonitoringEnabled, rules.screenMonitoringEnabled, onPassed]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="text-left">
      <Row label="Camera" status={results.camera ?? "pending"} />
      {rules.audioMonitoringEnabled && (
        <Row
          label="Microphone"
          status={results.mic ?? "pending"}
          note={results.mic === "running" ? "Say something…" : results.mic === "fail" ? "No sound detected" : null}
        />
      )}
      {results.mic === "running" && (
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.round(micLevel * 100)}%` }} />
        </div>
      )}
      <Row label="Network latency" status={results.network ?? "pending"} note={results.networkNote} />
      <Row label="Network speed" status={results.speed ?? "pending"} note={results.speedNote} />
      <Row label="Browser" status={results.browser ?? "pending"} note={results.browserNote} />
      {!running && Object.values(results).some((s) => s === "fail") && (
        <button
          type="button"
          onClick={run}
          className="mt-2 flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
        >
          <FaRedo size={10} /> Re-run checks
        </button>
      )}
      {(results.network === "warn" || results.speed === "warn") && (
        <p className="text-xs text-amber-400 mt-1">
          Your connection is slow (under 1 Mbps or high latency). You can continue, but proctoring frames may arrive late.
        </p>
      )}
    </div>
  );
};

export default SystemCheck;
