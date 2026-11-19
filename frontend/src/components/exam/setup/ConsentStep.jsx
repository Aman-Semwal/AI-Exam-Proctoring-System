import { useState } from "react";

/**
 * Step 2: what will be captured during this exam, based on its rules. The tick is
 * sent to the server (POST /sessions/{id}/consent) when the exam starts.
 */
const ConsentStep = ({ rules, onConsented }) => {
  const [agreed, setAgreed] = useState(false);

  const captures = [
    "Webcam snapshots every few seconds, analysed by AI for faces, gaze and objects",
    rules.identityCheckEnabled && "A verification photo, compared with your face during the exam",
    rules.audioMonitoringEnabled && "Microphone audio, checked for speech",
    rules.screenMonitoringEnabled && "Screenshots of your entire screen",
    "Browser activity: tab switches, leaving full screen" +
      (rules.clipboardBlockingEnabled ? ", copy/paste and blocked shortcuts" : ""),
  ].filter(Boolean);

  return (
    <div className="text-left text-sm">
      <p className="text-slate-300 mb-2">During this exam we capture:</p>
      <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs mb-3">
        {captures.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="text-xs text-slate-500 mb-3">
        Only proctors and administrators of your organization can see it, as evidence for flagged moments.
      </p>
      <label className="flex items-center gap-2 cursor-pointer text-slate-200 mb-3">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="accent-blue-500" />
        I understand and agree
      </label>
      <button
        type="button"
        disabled={!agreed}
        onClick={onConsented}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition"
      >
        Continue
      </button>
    </div>
  );
};

export default ConsentStep;
