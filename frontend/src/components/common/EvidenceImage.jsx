import { useEffect, useState } from "react";
import api from "../../services/api";

// Loads a violation's webcam snapshot through the authenticated API client —
// a plain <img src> can't send the JWT, so the image is fetched as a blob.
const EvidenceImage = ({ violationId, className = "" }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!violationId) return;
    let objectUrl = null;
    let cancelled = false;

    api
      .get(`/violations/${violationId}/evidence`, { responseType: "blob" })
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
  }, [violationId]);

  if (failed) return <p className="text-[11px] text-slate-500">Snapshot unavailable.</p>;
  if (!url) return <div className={`bg-white/3 animate-pulse rounded-lg ${className}`} />;
  return <img src={url} alt="Webcam snapshot when the violation was detected" className={`rounded-lg ${className}`} />;
};

export default EvidenceImage;
