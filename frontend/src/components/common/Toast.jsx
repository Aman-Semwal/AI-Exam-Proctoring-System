import { useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaTimes } from "react-icons/fa";

/**
 * Auto-dismissing toast notification.
 *
 * @param {{
 *   message: string,
 *   type?: "success" | "error",
 *   duration?: number,
 *   onClose: () => void,
 * }} props
 */
const Toast = ({ message, type = "success", duration = 4000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-6 right-6 z-[70] animate-fade-in">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-medium max-w-sm ${
          isSuccess
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
            : "bg-rose-500/10 border-rose-500/20 text-rose-300"
        }`}
      >
        {isSuccess ? (
          <FaCheckCircle size={13} className="text-emerald-400 shrink-0" />
        ) : (
          <FaTimesCircle size={13} className="text-rose-400 shrink-0" />
        )}

        <span className="flex-1">{message}</span>

        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white transition shrink-0"
        >
          <FaTimes size={10} />
        </button>
      </div>
    </div>
  );
};

export default Toast;
