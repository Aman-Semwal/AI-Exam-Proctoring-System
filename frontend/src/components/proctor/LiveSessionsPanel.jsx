import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBullhorn, FaStop, FaFileAlt } from "react-icons/fa";
import api from "../../services/api";
import TrustBadge from "../common/TrustBadge";

/**
 * Live sessions the proctor can act on: send a warning, terminate, or open the report.
 * Props: sessions (SessionResponse[]), onChanged() to refetch, onToast({type, message}).
 */
const LiveSessionsPanel = ({ sessions, onChanged, onToast }) => {
  const navigate = useNavigate();
  // { kind: "warn" | "terminate", session }
  const [action, setAction] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const open = (kind, session) => {
    setAction({ kind, session });
    setText(kind === "warn" ? "Please keep your face visible and eyes on the screen." : "");
  };

  const submit = async () => {
    if (!action || !text.trim()) return;
    const { kind, session } = action;
    try {
      setSending(true);
      if (kind === "warn") {
        await api.post(`/sessions/${session.id}/warn`, { message: text.trim() });
        onToast({ type: "success", message: `Warning sent to ${session.studentName}.` });
      } else {
        await api.put(`/sessions/${session.id}/terminate`, { message: text.trim() });
        onToast({ type: "success", message: `${session.studentName}'s exam was terminated.` });
        onChanged();
      }
      setAction(null);
    } catch (err) {
      onToast({ type: "error", message: err.response?.data?.message || "Action failed. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#121520] border border-white/7 rounded-xl p-5 shadow-sm">
      {sessions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">No students are taking an exam right now.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/6">
                <th className="py-2 pr-3 font-medium">Student</th>
                <th className="py-2 pr-3 font-medium">Exam</th>
                <th className="py-2 pr-3 font-medium">Trust</th>
                <th className="py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-b border-white/4">
                  <td className="py-2.5 pr-3 text-slate-200 font-medium">{s.studentName || `Session #${s.id}`}</td>
                  <td className="py-2.5 pr-3 text-slate-400">{s.examTitle}</td>
                  <td className="py-2.5 pr-3">
                    <TrustBadge score={s.trustScore} level={s.trustLevel} className="!px-2 !py-0.5 text-[10px]" />
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => open("warn", s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mr-1.5"
                    >
                      <FaBullhorn size={10} /> Warn
                    </button>
                    <button
                      type="button"
                      onClick={() => open("terminate", s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 mr-1.5"
                    >
                      <FaStop size={9} /> Terminate
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/reports/session/${s.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-white/10 text-slate-300 hover:bg-white/5"
                    >
                      <FaFileAlt size={9} /> Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {action && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-white/8 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-white">
              {action.kind === "warn" ? "Warn" : "Terminate exam for"} {action.session.studentName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {action.kind === "warn"
                ? "The message appears on the student's exam screen."
                : "The exam ends immediately and is scored as submitted. This cannot be undone."}
            </p>
            <textarea
              rows="3"
              maxLength={300}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={action.kind === "warn" ? "Message to the student" : "Reason (shown to the student and in the report)"}
              className="mt-4 w-full bg-[#090a0f] border border-white/8 focus:border-blue-500 rounded-lg p-3 text-xs text-white outline-none resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAction(null)}
                className="px-4 py-2 rounded-lg border border-white/8 text-xs text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending || !text.trim()}
                className={`px-4 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-50 ${
                  action.kind === "warn" ? "bg-amber-600 hover:bg-amber-500" : "bg-rose-600 hover:bg-rose-500"
                }`}
              >
                {sending ? "Sending…" : action.kind === "warn" ? "Send warning" : "Terminate exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionsPanel;
