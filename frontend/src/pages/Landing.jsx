/* ─── Landing.jsx — Hero page with gradient + CTAs ─────────── */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] },
});

const STATS = [
  { value: "99%", label: "Accuracy" },
  { value: "<2s", label: "Processing" },
  { value: "500+", label: "Symbols" },
  { value: "∞", label: "Equations" },
];

export default function Landing() {
  return (
    <div className="landing-page">
      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-bg-gradient" />
        <div className="hero-content">
          <motion.span className="hero-badge" {...fadeUp(0)}>
            🚀 AI-Powered • Next-Gen Math Tool
          </motion.span>

          <motion.h1 className="hero-title" {...fadeUp(0.1)}>
            AI-Powered{" "}
            <span className="hero-title-accent">Mathematical Intelligence</span>{" "}
            System
          </motion.h1>

          <motion.p className="hero-subtitle" {...fadeUp(0.2)}>
            Transform PDFs into precise LaTeX instantly. Select any equation,
            and let Gemini AI decode it — from simple integrals to complex
            tensor expressions.
          </motion.p>

          <motion.div className="hero-cta" {...fadeUp(0.3)}>
            <Link to="/app" className="btn-hero-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload PDF
            </Link>
            <Link to="/features" className="btn-hero-secondary">
              Explore Features →
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div className="hero-stats" {...fadeUp(0.4)}>
            {STATS.map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-value">{s.value}</span>
                <span className="hero-stat-label">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Quick Features Preview ─────────────────────────── */}
      <section className="landing-features-preview">
        <motion.h2 className="section-title" {...fadeUp(0)}>
          Why Researchers Love MIS-AI
        </motion.h2>
        <div className="feature-preview-grid">
          {[
            {
              icon: "📄",
              title: "PDF to LaTeX",
              desc: "Upload any math PDF and extract equations with a single click.",
            },
            {
              icon: "🎯",
              title: "Region Selection",
              desc: "Draw a box around any equation — AI handles the rest.",
            },
            {
              icon: "⚡",
              title: "Real-Time Rendering",
              desc: "See your LaTeX rendered live with KaTeX — instant feedback.",
            },
            {
              icon: "🧠",
              title: "Gemini AI Engine",
              desc: "Powered by Google Gemini Flash for unmatched accuracy.",
            },
          ].map((f, i) => (
            <motion.div key={f.title} className="feature-preview-card" {...fadeUp(0.1 * i)}>
              <span className="feature-preview-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
