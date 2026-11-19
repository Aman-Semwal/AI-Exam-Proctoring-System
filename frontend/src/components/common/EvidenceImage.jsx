import { useEffect, useState } from "react";
import api from "../../services/api";

// Loads a violation's evidence image (kind CAMERA = webcam snapshot, SCREEN = screenshot)
// through the authenticated API client — a plain <img src> can't send the JWT, so the
// image is fetched as a blob.
const EvidenceImage = ({ violationId, kind = "CAMERA", className = "" }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!violationId) return;
    let objectUrl = null;
    let cancelled = false;

    api
      .get(`/violations/${violationId}/evidence?kind=${kind}`, { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [violationId, kind]);

  const label = kind === "SCREEN" ? "Screenshot" : "Snapshot";
  if (failed) return <p className="text-[11px] text-slate-500">{label} unavailable.</p>;
  if (!url) return <div className={`bg-white/3 animate-pulse rounded-lg ${className}`} />;
  const alt = kind === "SCREEN" ? "Student's screen when the violation was detected" : "Webcam snapshot when the violation was detected";
  return <img src={url} alt={alt} className={`rounded-lg ${className}`} />;
};

export default EvidenceImage;
