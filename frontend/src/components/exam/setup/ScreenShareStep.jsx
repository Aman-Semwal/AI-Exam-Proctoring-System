import { useEffect, useRef, useState } from "react";
import { FaDesktop, FaCheckCircle } from "react-icons/fa";

import { requestEntireScreen } from "../../../utils/screenShare";

/** Step 3: share the entire screen; shows a small preview once shared. */
const ScreenShareStep = ({ stream, onShared }) => {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    if (previewRef.current) previewRef.current.srcObject = stream || null;
  }, [stream]);

  const share = async () => {
    setBusy(true);
    setError("");
    try {
      onShared(await requestEntireScreen());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (stream) {
    return (
      <div className="flex items-center gap-3 text-left">
        <video ref={previewRef} autoPlay muted playsInline className="w-32 aspect-video rounded border border-white/10 bg-black" />
        <span className="flex items-center gap-2 text-sm text-emerald-400">
          <FaCheckCircle /> Entire screen shared
        </span>
      </div>
    );
  }

  return (
    <div className="text-left">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
      >
        <FaDesktop /> {busy ? "Waiting for your choice…" : "Share Entire Screen"}
      </button>
      {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
    </div>
  );
};

export default ScreenShareStep;
