import { useEffect, useRef, useState } from "react";
import { FaEllipsisV } from "react-icons/fa";
import { createPortal } from "react-dom";

/**
 * Reusable row-action dropdown for SuperAdmin tables.
 *
 * @param {{ actions: Array<{ label: string, icon?: React.ElementType, onClick: () => void, danger?: boolean }> }} props
 */
const ActionDropdown = ({ actions = [] }) => {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  // Position calculation and scroll/resize handling
  useEffect(() => {
    if (open && ref.current) {
      const updatePosition = () => {
        const rect = ref.current.getBoundingClientRect();
        // 176px = w-44
        // Check if there is enough space below, else show above
        const spaceBelow = window.innerHeight - rect.bottom;
        const dropdownHeight = actions.length * 36 + 10; // rough estimate
        
        if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
          setPosition({ top: rect.top - dropdownHeight, left: rect.right - 176 });
        } else {
          setPosition({ top: rect.bottom + 4, left: rect.right - 176 });
        }
      };

      updatePosition();
      
      const handleScroll = () => updatePosition();
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleScroll);
      return () => {
        window.removeEventListener("scroll", handleScroll, true);
        window.removeEventListener("resize", handleScroll);
      };
    }
  }, [open, actions.length]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      if (
        ref.current && !ref.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
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
        className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition"
        title="Actions"
      >
        <FaEllipsisV size={11} />
      </button>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: position.top, left: position.left }}
          className="fixed z-9999 w-44 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-2xl py-1 animate-scale-in"
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  action.onClick();
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition text-left ${
                  action.danger
                    ? "text-rose-400 hover:bg-rose-500/10"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {Icon && <Icon size={11} />}
                {action.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};

export default ActionDropdown;
