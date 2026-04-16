import "./App.css";
import Home from "./pages/Home";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";

const NAV_ITEMS = ["Home", "About", "Features", "Services", "Contact"];

function App() {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  return (
    <div className={`min-h-screen text-white ${theme === "light" ? "light-mode" : ""}`}>
      {/* ── Header: two-row academic style ──────────────────── */}
      <header className="app-header">
        {/* ── Row 1: Logos + Title block ──────────────────────── */}
        <div className="header-top">
          {/* Left: 3 logos */}
          <div className="header-logos">
            {/* Logo 1 — University / Institution */}
            <div className="header-logo-item">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20h20" />
                <path d="M5 20V9l7-5 7 5v11" />
                <path d="M9 20v-5h6v5" />
                <path d="M9 12h1" /><path d="M14 12h1" />
              </svg>
            </div>

            {/* Logo 2 — Department */}
            <div className="header-logo-item">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z" />
                <path d="M8 8l2.5 4L8 16" />
                <path d="M14 12h2" />
              </svg>
            </div>

            {/* Logo 3 — Lab / Research Group */}
            <div className="header-logo-item">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3h6v4H9z" />
                <path d="M10 7v3l-4 8h12l-4-8V7" />
                <circle cx="12" cy="15" r="1" />
              </svg>
            </div>
          </div>

          {/* Right: Title + Subtitle + Tagline */}
          <motion.div
            className="header-title-block"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
          >
            <h1 className="header-main-title">MIS-AI: Mathematical Intelligence System</h1>
            <p className="header-subtitle">Department of Mathematics</p>
            <p className="header-tagline">Equation Recognition • AI Processing • LaTeX Generation</p>
          </motion.div>

          {/* Mobile hamburger */}
          <button
            className="hamburger md:hidden"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={mobileMenuOpen ? { rotate: 90 } : { rotate: 0 }}
              transition={{ duration: 0.2 }}
            >
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </motion.svg>
          </button>
        </div>

        {/* ── Row 2: Navigation bar (separate row, right-aligned) ── */}
        <nav className="header-nav hidden md:flex">
          <div className="header-nav-inner">
            {/* Extract button — rendered via portal from Home */}
            <div id="header-extract-slot" className="flex items-center" />

            <div className="header-nav-links">
              {/* Dark / Light toggle */}
              <motion.button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {theme === "dark" ? (
                    <motion.svg
                      key="sun"
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}
                    >
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </motion.svg>
                  ) : (
                    <motion.svg
                      key="moon"
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}
                    >
                      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </motion.button>

              {NAV_ITEMS.map((item) => (
                <button key={item} className="nav-link">
                  {item}
                </button>
              ))}

              <div className="header-separator" />

              <button className="btn-ghost">Login</button>
              <button className="btn-primary">Sign Up</button>
            </div>
          </div>
        </nav>

        {/* ─── Mobile dropdown menu ────────────────────────────── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="mobile-menu md:hidden"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <nav className="flex flex-col gap-1 px-4 pb-4 pt-2">
                {NAV_ITEMS.map((item) => (
                  <button key={item} className="mobile-nav-link">
                    {item}
                  </button>
                ))}
                <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                  <button className="theme-toggle-btn flex-1" onClick={toggleTheme}>
                    {theme === "dark" ? "☀ Light" : "🌙 Dark"}
                  </button>
                  <button className="btn-ghost flex-1">Login</button>
                  <button className="btn-primary flex-1">Sign Up</button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Home
        file={file}
        setFile={setFile}
        fileId={fileId}
        setFileId={setFileId}
        uploading={uploading}
        setUploading={setUploading}
      />
    </div>
  );
}

export default App;
