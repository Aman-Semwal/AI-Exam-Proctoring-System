import { FaExclamationTriangle } from "react-icons/fa";

/**
 * Reusable confirmation dialog for destructive actions.
 *
 * @param {{
 *   open: boolean,
 *   title: string,
 *   message: string,
 *   confirmLabel?: string,
 *   loading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
const ConfirmDialog = ({
  open,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className="w-full max-w-sm bg-[#121520] border border-white/8 rounded-xl shadow-2xl animate-scale-in">
        <div className="p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 shrink-0 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400">
              <FaExclamationTriangle size={14} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>

              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-white/8 bg-[#090a0f] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
