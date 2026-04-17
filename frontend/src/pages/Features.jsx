/* ─── Features.jsx — Feature cards with glassmorphism ──────── */
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] },
});

const FEATURES = [
  {
    icon: "📄",
    title: "PDF to LaTeX Conversion",
    desc: "Upload any mathematical PDF and extract equations into clean, copy-paste-ready LaTeX code. Supports all standard PDF formats.",
    tag: "Core",
  },
  {
    icon: "🎯",
    title: "Equation Recognition",
    desc: "Draw a selection box around any equation in the PDF viewer. Our AI identifies and isolates the mathematical content with pixel-level precision.",
    tag: "Core",
  },
  {
    icon: "✨",
    title: "Highlight-to-LaTeX",
    desc: "Select a region, click extract, and get instant LaTeX. From simple fractions to complex summations — one click is all it takes.",
    tag: "Core",
  },
  {
    icon: "🧠",
    title: "Full Page AI Conversion",
    desc: "Convert an entire page of equations into structured LaTeX with a single action. Ideal for digitising handwritten lecture notes.",
    tag: "Premium",
  },
  {
    icon: "🔍",
    title: "Zoomable PDF Viewer",
    desc: "Pinch-to-zoom, smooth panning, and high-DPI rendering powered by pdf.js. Navigate multi-page documents with ease.",
    tag: "Built-in",
  },
  {
    icon: "⚡",
    title: "Real-Time LaTeX Rendering",
    desc: "See your extracted LaTeX rendered instantly with KaTeX. Toggle between source code and beautifully typeset output.",
    tag: "Built-in",
  },
];

export default function Features() {
  return (
    <div className="page-container">
      <section className="page-hero">
        <motion.h1 className="page-hero-title" {...fadeUp(0)}>
          <span className="text-gradient">Features</span>
        </motion.h1>
        <motion.p className="page-hero-desc" {...fadeUp(0.1)}>
          Every tool a mathematician needs, powered by AI.
        </motion.p>
      </section>

      <section className="content-section">
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="feature-card glass-card" {...fadeUp(0.08 * i)}>
              <div className="feature-card-header">
                <span className="feature-card-icon">{f.icon}</span>
                <span className={`feature-tag feature-tag--${f.tag.toLowerCase()}`}>
                  {f.tag}
                </span>
              </div>
              <h3 className="feature-card-title">{f.title}</h3>
              <p className="feature-card-desc">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
