/* ─── About.jsx — Institution & AI system description ──────── */
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] },
});

const TIMELINE = [
  { year: "2024", title: "Research Initiated", desc: "Deep learning meets mathematical typesetting — the seed of MIS-AI." },
  { year: "2025", title: "Prototype Launched", desc: "First working PDF-to-LaTeX pipeline with pix2tex integration." },
  { year: "2026", title: "Gemini AI Integration", desc: "Switched to Google Gemini Flash for production-grade accuracy." },
];

export default function About() {
  return (
    <div className="page-container">
      {/* Hero banner */}
      <section className="page-hero">
        <motion.h1 className="page-hero-title" {...fadeUp(0)}>
          About <span className="text-gradient">MIS-AI</span>
        </motion.h1>
        <motion.p className="page-hero-desc" {...fadeUp(0.1)}>
          Where rigorous mathematics meets cutting-edge artificial intelligence.
        </motion.p>
      </section>

      {/* Mission */}
      <section className="content-section">
        <div className="glass-card">
          <motion.div {...fadeUp(0.1)}>
            <h2 className="section-heading">Our Mission</h2>
            <p className="section-body">
              MIS-AI — the <strong>Mathematical Intelligence System</strong> — was born from a
              simple frustration: extracting equations from research papers shouldn't require
              manual retyping. We fuse state-of-the-art vision AI with the elegance of LaTeX
              to give mathematicians, researchers, and students a tool that <em>just works</em>.
            </p>
            <p className="section-body">
              Built at the Department of Mathematics, our system processes PDFs at the pixel
              level, identifies equation regions through intelligent cropping, and leverages
              Google's Gemini Flash model to produce publication-ready LaTeX — all in under
              two seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Innovation */}
      <section className="content-section">
        <motion.h2 className="section-title" {...fadeUp(0)}>
          Innovation at the Intersection
        </motion.h2>
        <div className="two-col-grid">
          <motion.div className="glass-card" {...fadeUp(0.1)}>
            <h3 className="card-heading">🔬 Mathematics</h3>
            <p className="card-body">
              Deep understanding of mathematical notation, from basic algebra to advanced
              differential geometry, ensures our LaTeX output is semantically correct — not
              just visually similar.
            </p>
          </motion.div>
          <motion.div className="glass-card" {...fadeUp(0.2)}>
            <h3 className="card-heading">🤖 Artificial Intelligence</h3>
            <p className="card-body">
              Gemini Flash's multimodal vision capabilities interpret equation images with
              context awareness, handling edge cases like nested fractions, multi-line
              derivations, and unusual symbol combinations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Timeline */}
      <section className="content-section">
        <motion.h2 className="section-title" {...fadeUp(0)}>Our Journey</motion.h2>
        <div className="timeline">
          {TIMELINE.map((item, i) => (
            <motion.div key={item.year} className="timeline-item" {...fadeUp(0.1 * i)}>
              <span className="timeline-year">{item.year}</span>
              <div className="timeline-content">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
