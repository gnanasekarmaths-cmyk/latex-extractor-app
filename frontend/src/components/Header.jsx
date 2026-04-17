/* ─── Header.jsx — Premium SaaS-level sticky glassmorphism navbar v2 ── */
import { useState, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ── Navigation items ─────────────────────────────────────────── */
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
    /* ── Sticky wrapper ───────────────────────────────────────── */
    <header className="sticky top-0 z-50 w-full">
      {/* ── Glass card with margin for floating effect ────────── */}
      <div className="mx-4 mt-4 bg-white/70 dark:bg-[#0f172a]/80 backdrop-blur-md
                      shadow-md rounded-2xl px-6 py-3">
        <div className="flex items-center justify-between">

          {/* ═══════════════════════════════════════════════════ */}
          {/* ── LEFT: Branding (Logo + Text) ──────────────────── */}
          {/* ═══════════════════════════════════════════════════ */}
          <Link to="/" className="flex items-center gap-3 no-underline group">

            {/* Text stack — MIS-AI is the visual hero */}
            <div className="flex flex-col leading-tight">
              {/* Main title — bold gradient, largest element */}
              <span className="text-2xl md:text-4xl font-extrabold tracking-wide
                               bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500
                               bg-clip-text text-transparent">
                MIS-AI
              </span>

              {/* Subtitle — professional, understated */}
              <span className="text-[10px] md:text-xs font-medium text-gray-500
                               dark:text-gray-400 tracking-wide">
                Mathematical Intelligence System
              </span>

              {/* Tagline — very subtle purple accent */}
              <span className="hidden sm:block text-[8px] md:text-[10px] font-medium
                               text-purple-400/60 dark:text-purple-400/50
                               tracking-wider mt-0.5">
                Equation Recognition &bull; AI Processing &bull; LaTeX Generation
              </span>
            </div>
          </Link>

          {/* ═══════════════════════════════════════════════════ */}
          {/* ── RIGHT: Desktop navigation ─────────────────────── */}
          {/* ═══════════════════════════════════════════════════ */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {NAV_ITEMS.map(({ label, path }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={label}
                  to={path}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold
                              transition-all duration-300 ease-out
                    ${isActive
                      ? "text-purple-500 dark:text-purple-400 bg-purple-500/10"
                      : "text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-300 hover:bg-purple-50/80 dark:hover:bg-white/[0.06]"
                    }`}
                >
                  {label}
                  {/* Animated underline indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2
                                 h-[2.5px] w-5 rounded-full
                                 bg-gradient-to-r from-purple-500 to-pink-500"
                      transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    />
                  )}
                </Link>
              );
            })}

            {/* Theme toggle button */}
            <motion.button
              className="ml-3 flex items-center justify-center w-9 h-9 rounded-xl
                         border border-gray-200/60 dark:border-white/10
                         bg-white/50 dark:bg-white/[0.04]
                         text-gray-500 dark:text-gray-400
                         hover:border-purple-400/50 hover:text-purple-500
                         dark:hover:text-purple-400
                         transition-all duration-300 cursor-pointer"
              onClick={toggleTheme}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.svg key="sun" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}>
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
                  <motion.svg key="moon" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.2 }}>
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>
          </nav>

          {/* ═══════════════════════════════════════════════════ */}
          {/* ── Mobile hamburger button ───────────────────────── */}
          {/* ═══════════════════════════════════════════════════ */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl
                       border border-gray-200/60 dark:border-white/10
                       bg-white/50 dark:bg-white/[0.04]
                       text-gray-600 dark:text-gray-300
                       hover:bg-purple-50 dark:hover:bg-white/[0.08]
                       transition-all duration-200 cursor-pointer"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <motion.svg
              width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ── Mobile dropdown menu ──────────────────────────────── */}
      {/* ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden mx-4 mt-2 rounded-2xl overflow-hidden
                       border border-gray-200/40 dark:border-white/10
                       bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-lg shadow-lg"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <nav className="flex flex-col gap-1 px-4 pb-4 pt-3">
              {NAV_ITEMS.map(({ label, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={label}
                    to={path}
                    onClick={closeMobile}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold
                                transition-all duration-200
                      ${isActive
                        ? "text-purple-500 dark:text-purple-400 bg-purple-500/10"
                        : "text-gray-600 dark:text-gray-300 hover:text-purple-500 dark:hover:text-white hover:bg-purple-50 dark:hover:bg-white/[0.06]"
                      }`}
                  >
                    {label}
                  </Link>
                );
              })}

              {/* Mobile theme toggle */}
              <div className="mt-2 pt-2 border-t border-gray-200/40 dark:border-white/10">
                <button
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium
                             border border-gray-200/60 dark:border-white/10
                             bg-white/50 dark:bg-white/[0.04]
                             text-gray-600 dark:text-gray-300
                             hover:bg-purple-50 dark:hover:bg-white/[0.08]
                             transition-all duration-200 cursor-pointer"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
