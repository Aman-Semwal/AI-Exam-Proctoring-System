import { useEffect, useRef, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";

/**
 * Reusable row-action dropdown for SuperAdmin tables.
 *
 * @param {{ actions: Array<{ label: string, icon?: React.ElementType, onClick: () => void, danger?: boolean }> }} props
 */
const ActionDropdown = ({ actions = [] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="p-1.5 hover:bg-white/[0.05] rounded text-slate-400 hover:text-white transition"
        title="Actions"
      >
        <FaEllipsisV size={11} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#1a1f2e] border border-white/[0.1] rounded-lg shadow-2xl py-1 animate-scale-in">
          {actions.map((action, index) => {
            const Icon = action.icon;

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition text-left ${
                  action.danger
                    ? "text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {Icon && <Icon size={11} />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionDropdown;
