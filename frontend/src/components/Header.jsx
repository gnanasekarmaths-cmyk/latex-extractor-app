/* ─── Header.jsx — Sticky header with logo + navigation ─────── */
import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Features", path: "/features" },
  { label: "Services", path: "/services" },
  { label: "Contact", path: "/contact" },
];

export default function Header({ theme, toggleTheme }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const closeMobile = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <header className="app-header">
      {/* ── Row 1: Logo + Title ──────────────────────────────── */}
      <div className="header-top">
        <Link to="/" className="header-logos" style={{ textDecoration: "none" }}>
          <img
            src="/logo.png"
            alt="MIS-AI Logo"
            className="header-logo-img"
          />
        </Link>

        <motion.div
          className="header-title-block"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <h1 className="header-main-title">
            MIS-AI: Mathematical Intelligence System
          </h1>
          <p className="header-subtitle">Infinity Research and Development Institute</p>
          <p className="header-tagline">
            Equation Recognition • AI Processing • LaTeX Generation
          </p>
        </motion.div>

        {/* Mobile hamburger */}
        <button
          className="hamburger md:hidden"
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <motion.svg
            width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
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

      {/* ── Row 2: Desktop Navigation ────────────────────────── */}
      <nav className="header-nav hidden md:flex">
        <div className="header-nav-inner">
          <div id="header-extract-slot" className="flex items-center" />
          <div className="header-nav-links">
            {/* Theme toggle */}
            <motion.button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.svg key="sun" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }} transition={{ duration: 0.2 }}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </motion.svg>
                ) : (
                  <motion.svg key="moon" width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }} transition={{ duration: 0.2 }}>
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

            {NAV_ITEMS.map(({ label, path }) => (
              <Link
                key={label}
                to={path}
                className={`nav-link${location.pathname === path ? " nav-link--active" : ""}`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Mobile dropdown ──────────────────────────────────── */}
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
              {NAV_ITEMS.map(({ label, path }) => (
                <Link
                  key={label}
                  to={path}
                  className={`mobile-nav-link${location.pathname === path ? " mobile-nav-link--active" : ""}`}
                  onClick={closeMobile}
                >
                  {label}
                </Link>
              ))}
              <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                <button className="theme-toggle-btn flex-1" onClick={toggleTheme}>
                  {theme === "dark" ? "☀ Light" : "🌙 Dark"}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
