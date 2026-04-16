/**
 * Toast notification system with Framer Motion animations.
 *
 * Usage:
 *   import { ToastProvider, useToast } from "../components/Toast";
 *
 *   // Wrap app in <ToastProvider>
 *   // Then in any child:  const toast = useToast();
 *   //                     toast.success("Copied!");
 *   //                     toast.error("Something went wrong");
 */

import { createContext, useCallback, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3000) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) setTimeout(() => remove(id), duration);
      return id;
    },
    [remove],
  );

  const api = {
    success: (msg, ms) => push(msg, "success", ms),
    error: (msg, ms) => push(msg, "error", ms),
    info: (msg, ms) => push(msg, "info", ms),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-container">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`toast toast-${t.type}`}
              onClick={() => remove(t.id)}
            >
              {t.type === "success" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {t.type === "error" && (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                  <path d="M6 6l4 4M10 6l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              <span>{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
