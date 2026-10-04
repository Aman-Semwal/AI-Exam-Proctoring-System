// Trust score (0–100) with its band: TRUSTED ≥ 80, REVIEW 50–79, SUSPICIOUS < 50.
const STYLES = {
  TRUSTED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REVIEW: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  SUSPICIOUS: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};
const LABELS = { TRUSTED: "Trusted", REVIEW: "Review", SUSPICIOUS: "Suspicious" };

const TrustBadge = ({ score, level, className = "" }) => {
  if (score == null || !level) return null;
  return (
    <span
      title="Trust score: 100 minus penalties for proctoring violations that were not dismissed"
      className={`px-3 py-1 rounded-full text-xs font-semibold border w-fit ${STYLES[level] || ""} ${className}`}
    >
      Trust {score}/100 · {LABELS[level] || level}
    </span>
  );
};

export default TrustBadge;
