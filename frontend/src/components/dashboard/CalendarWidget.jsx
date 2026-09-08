const CalendarWidget = () => {
  const headers = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const today = 12;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>August 2026</h2>
        <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>Academic Cal</span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {headers.map((h) => (
          <div key={h} className="h-7 flex items-center justify-center text-[10px] font-bold"
            style={{ color: "var(--text-muted)" }}>
            {h}
          </div>
        ))}
        {days.map((d) => (
          <div
            key={d}
            className="h-7 flex items-center justify-center rounded-lg text-xs transition"
            style={
              d === today
                ? { background: "#2563eb", color: "#fff", fontWeight: 700 }
                : { color: "var(--text-secondary)" }
            }
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarWidget;