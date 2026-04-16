import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LAYOUT_OPTIONS = [
  {
    value: "Desktop",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    value: "Tablet",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    value: "Mobile",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
];

export default function LayoutSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const current = LAYOUT_OPTIONS.find((o) => o.value === value) || LAYOUT_OPTIONS[0];

  return (
    <div className="layout-dropdown-wrapper" ref={wrapperRef}>
      <button
        className="layout-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.icon}
        <span>{current.value}</span>
        <svg
          className={`layout-dropdown-chevron${open ? " open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            className="layout-dropdown-menu"
            role="listbox"
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {LAYOUT_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  className={`layout-dropdown-item${value === opt.value ? " active" : ""}`}
                  role="option"
                  aria-selected={value === opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="layout-dropdown-item-label">
                    {opt.icon}
                    {opt.value}
                  </span>
                  {value === opt.value && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Segmented variant for mobile menus */
export function LayoutSelectorMobile({ value, onChange }) {
  return (
    <div className="mobile-layout-section">
      <span className="mobile-layout-label">Layout</span>
      <div className="mobile-layout-options">
        {LAYOUT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`mobile-layout-btn${value === opt.value ? " active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon}
            <span>{opt.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
