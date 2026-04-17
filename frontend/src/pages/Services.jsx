/* ─── Services.jsx — Academic support & AI services ────────── */
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] },
});

const SERVICES = [
  {
    icon: "🎓",
    title: "Academic Support Tools",
    desc: "Purpose-built for university researchers and postgraduate students. Convert lecture PDFs, thesis drafts, and problem sets into editable LaTeX in seconds.",
    features: ["Thesis equation extraction", "Lecture note digitisation", "Assignment conversion"],
  },
  {
    icon: "🔬",
    title: "Research Assistance",
    desc: "Accelerate your research workflow. Extract equations from published papers, arXiv preprints, and conference proceedings without manual retyping.",
    features: ["Cross-reference equations", "Batch processing", "Citation-ready output"],
  },
  {
    icon: "🔄",
    title: "Automated Document Conversion",
    desc: "Transform scanned documents, handwritten notes, and legacy PDFs into modern, searchable LaTeX files with our AI pipeline.",
    features: ["Scanned PDF support", "Multi-page extraction", "Format preservation"],
  },
  {
    icon: "⚙️",
    title: "AI-Powered Math Processing",
    desc: "Gemini Flash vision AI understands mathematical context — not just pixel patterns. Get semantically correct LaTeX that compiles without errors.",
    features: ["500+ symbol library", "Nested expression handling", "Context-aware parsing"],
  },
];

export default function Services() {
  return (
    <div className="page-container">
      <section className="page-hero">
        <motion.h1 className="page-hero-title" {...fadeUp(0)}>
          Our <span className="text-gradient">Services</span>
        </motion.h1>
        <motion.p className="page-hero-desc" {...fadeUp(0.1)}>
          AI-driven tools for the modern mathematician.
        </motion.p>
      </section>

      <section className="content-section">
        <div className="services-grid">
          {SERVICES.map((s, i) => (
            <motion.div key={s.title} className="service-card glass-card" {...fadeUp(0.1 * i)}>
              <span className="service-icon">{s.icon}</span>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
              <ul className="service-features">
                {s.features.map((f) => (
                  <li key={f}>
                    <span className="service-check">✓</span> {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="content-section" style={{ textAlign: "center" }}>
        <motion.div {...fadeUp(0.2)}>
          <h2 className="section-title">Ready to Transform Your Workflow?</h2>
          <p className="section-body" style={{ maxWidth: 480, margin: "0 auto 24px" }}>
            Upload your first PDF and experience AI-powered equation extraction.
          </p>
          <Link to="/app" className="btn-hero-primary" style={{ display: "inline-flex" }}>
            Get Started Free →
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
