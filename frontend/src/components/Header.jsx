/* ─── Header.jsx — Premium sticky glassmorphism header ─────── */
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
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between bg-white/70 dark:bg-[#0f172a]/80 backdrop-blur-md shadow-md rounded-2xl px-5 py-3">

          {/* ── Left: Logo + Text block ─────────────────────── */}
          <Link to="/" className="flex items-center gap-4 no-underline group">
            {/* Logo — visually prominent */}
            <img
              src="/logo.png"
              alt="MIS-AI Logo"
              className="h-6 w-auto rounded-lg object-contain shrink-0
                         ring-1 ring-purple-500/20 group-hover:ring-purple-500/50
                         shadow-sm shadow-purple-500/10 group-hover:shadow-purple-500/20
                         transition-all duration-300"
            />

            {/* Stacked text — visually equal weight to logo */}
            <div className="flex flex-col leading-tight">
              {/* App name — bold gradient, dominant */}
              <span
                className="text-2xl md:text-4xl font-extrabold tracking-wide
                           bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500
                           bg-clip-text text-transparent drop-shadow-sm"
              >
                MIS-AI
              </span>

              {/* Subtitle — clean academic font */}
              <span className="text-[11px] md:text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
                Mathematical Intelligence System
              </span>

              {/* Tagline — purple highlight */}
              <span className="hidden sm:block text-[9px] md:text-xs font-semibold text-purple-500/80 dark:text-purple-400/80 tracking-wider mt-0.5">
                Equation Recognition • AI Processing • LaTeX Generation
              </span>
            </div>
          </Link>

          {/* ── Right: Desktop navigation ───────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={label}
                  to={path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-semibold
                    transition-all duration-300 ease-out
                    ${isActive
                      ? "text-purple-400 bg-purple-500/10 shadow-sm shadow-purple-500/10"
                      : "text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/[0.06] hover:scale-105"
                    }`}
                >
                  {label}
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Theme toggle */}
            <motion.button
              className="ml-2 flex items-center justify-center w-9 h-9 rounded-xl
                         border border-white/10 bg-white/[0.04] text-gray-400
                         hover:border-purple-500/40 hover:text-purple-400
                         transition-all duration-300 cursor-pointer"
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
          </nav>

          {/* ── Mobile hamburger ────────────────────────────── */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl
                       border border-white/10 bg-white/[0.04] text-gray-300
                       hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
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
      </div>

      {/* ── Mobile dropdown menu ────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <nav className="flex flex-col gap-1 px-4 pb-4 pt-2">
              {NAV_ITEMS.map(({ label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={label}
                    to={path}
                    onClick={closeMobile}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                      ${isActive
                        ? "text-purple-400 bg-purple-500/10"
                        : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
                <button
                  className="flex-1 px-4 py-2 rounded-xl text-sm font-medium
                             border border-white/10 bg-white/[0.04] text-gray-300
                             hover:bg-white/[0.08] transition-all duration-200 cursor-pointer"
                  onClick={toggleTheme}
                >
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
