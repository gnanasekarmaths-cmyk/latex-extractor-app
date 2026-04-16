/**
 * LatexViewer — displays raw LaTeX source + KaTeX rendered math
 * with toggle view, focus mode modal, zoom support, and copy.
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useToast } from "./Toast";

/* ── Shared SVG icon helpers ────────────────────────────────────── */
const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function LatexViewer({ latex, extracting = false, zoom = 1 }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("rendered"); // "code" | "rendered"
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusZoom, setFocusZoom] = useState(1.4);

  // ── KaTeX render (memoised per value) ──────────────────────────
  const { html, error } = useMemo(() => {
    if (!latex) return { html: "", error: "" };
    try {
      return {
        html: katex.renderToString(latex, { throwOnError: true, displayMode: true }),
        error: "",
      };
    } catch (err) {
      return {
        html: katex.renderToString(latex, { throwOnError: false, displayMode: true }),
        error: err.message,
      };
    }
  }, [latex]);

  // ── Copy handler ───────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 1500);
    });
  }, [latex, toast]);

  // ── Lock body scroll when focus modal is open ──────────────────
  useEffect(() => {
    if (focusOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [focusOpen]);

  // ── Close focus on Escape ──────────────────────────────────────
  useEffect(() => {
    if (!focusOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setFocusOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focusOpen]);

  /* ── Focus-mode modal (portalled to body) ─────────────────────── */
  const focusModal = focusOpen && createPortal(
    <AnimatePresence>
      <motion.div
        className="focus-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={() => setFocusOpen(false)}
      >
        <motion.div
          className="focus-modal"
          initial={{ opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header bar */}
          <div className="focus-modal__header">
            <h2 className="focus-modal__title">Focus Mode</h2>

            <div className="focus-modal__controls">
              {/* Toggle */}
              <div className="view-toggle view-toggle--focus">
                <button
                  className={`view-toggle__btn ${viewMode === "code" ? "view-toggle__btn--active" : ""}`}
                  onClick={() => setViewMode("code")}
                >
                  Code
                </button>
                <button
                  className={`view-toggle__btn ${viewMode === "rendered" ? "view-toggle__btn--active" : ""}`}
                  onClick={() => setViewMode("rendered")}
                >
                  Rendered
                </button>
              </div>

              {/* Focus zoom */}
              <div className="focus-modal__zoom">
                <button
                  className="zoom-btn"
                  onClick={() => setFocusZoom((z) => Math.max(0.6, +(z - 0.2).toFixed(1)))}
                  aria-label="Focus zoom out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
                <span className="focus-modal__zoom-level">{Math.round(focusZoom * 100)}%</span>
                <button
                  className="zoom-btn"
                  onClick={() => setFocusZoom((z) => Math.min(3.0, +(z + 0.2).toFixed(1)))}
                  aria-label="Focus zoom in"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </button>
              </div>

              {/* Copy */}
              <button className="copy-button" onClick={handleCopy} title="Copy LaTeX">
                {copied ? <CheckIcon /> : <CopyIcon />}
                {copied ? "Copied!" : "Copy"}
              </button>

              {/* Close */}
              <button
                className="focus-modal__close"
                onClick={() => setFocusOpen(false)}
                aria-label="Close focus mode"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="focus-modal__body">
            <AnimatePresence mode="wait">
              {viewMode === "code" ? (
                <motion.pre
                  key="focus-code"
                  className="latex-source focus-modal__code"
                  style={{ fontSize: `${0.95 * focusZoom}rem` }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {latex}
                </motion.pre>
              ) : (
                <motion.div
                  key="focus-rendered"
                  className="latex-output focus-modal__rendered"
                  style={{ fontSize: `${focusZoom}em` }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </AnimatePresence>
            {error && (
              <div className="latex-parse-error" style={{ marginTop: 12 }}>
                ⚠ KaTeX parse warning: {error}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );

  /* ── Main panel render ────────────────────────────────────────── */
  return (
    <>
      <AnimatePresence mode="wait">
        {extracting && !latex && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="latex-results glass-panel"
          >
            <div className="latex-header">
              <div className="h-5 w-36 rounded-md bg-surface-overlay animate-pulse" />
              <div className="h-8 w-16 rounded-md bg-surface-overlay animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-12 w-full rounded-lg bg-surface-overlay animate-pulse" />
              <div className="h-20 w-full rounded-lg bg-surface-overlay animate-pulse" />
              <div className="h-6 w-2/3 rounded-md bg-surface-overlay animate-pulse" />
            </div>
          </motion.div>
        )}
        {latex && (
          <motion.div
            key={latex}
            initial={{ opacity: 0, y: 12, scale: 0.96, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.97, filter: 'blur(2px)' }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            className="latex-results glass-panel"
          >
            {/* ── Header: title + action buttons ────────────────── */}
            <div className="latex-header">
              <h2>Extracted LaTeX</h2>
              <div className="latex-header__actions">
                <button
                  className="focus-mode-btn"
                  onClick={() => setFocusOpen(true)}
                  title="Focus Mode"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3H5a2 2 0 00-2 2v3" />
                    <path d="M21 8V5a2 2 0 00-2-2h-3" />
                    <path d="M3 16v3a2 2 0 002 2h3" />
                    <path d="M16 21h3a2 2 0 002-2v-3" />
                  </svg>
                  Focus
                </button>
                <motion.button
                  className="copy-button"
                  onClick={handleCopy}
                  title="Copy LaTeX"
                  whileHover={{ scale: 1.04 }}
                  animate={copied ? { scale: [1, 0.88, 1] } : {}}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span key="check" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.15 }}>
                        <CheckIcon />
                      </motion.span>
                    ) : (
                      <motion.span key="copy" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.15 }}>
                        <CopyIcon />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {copied ? "Copied!" : "Copy"}
                </motion.button>
              </div>
            </div>

            {/* ── View toggle ───────────────────────────────────── */}
            <div className="view-toggle">
              <button
                className={`view-toggle__btn ${viewMode === "code" ? "view-toggle__btn--active" : ""}`}
                onClick={() => setViewMode("code")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Code
              </button>
              <button
                className={`view-toggle__btn ${viewMode === "rendered" ? "view-toggle__btn--active" : ""}`}
                onClick={() => setViewMode("rendered")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Rendered
              </button>
            </div>

            {/* ── Content area with animated switch ─────────────── */}
            <div className="latex-view-content">
              <AnimatePresence mode="wait">
                {viewMode === "code" ? (
                  <motion.pre
                    key="code"
                    className="latex-source"
                    style={{ fontSize: `${0.85 * zoom}rem` }}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.2 }}
                  >
                    {latex}
                  </motion.pre>
                ) : (
                  <motion.div
                    key="rendered"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                  >
                    {error && (
                      <div className="latex-parse-error">
                        ⚠ KaTeX parse warning: {error}
                      </div>
                    )}
                    {/* KaTeX output from backend LaTeX via katex.renderToString — safe HTML */}
                    <div
                      className="latex-output"
                      style={{ fontSize: `${zoom}em` }}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Focus modal portal */}
      {focusModal}
    </>
  );
}
