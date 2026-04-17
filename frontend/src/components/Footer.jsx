/* ─── Footer.jsx — Site-wide footer ─────────────────────────── */
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand */}
        <div className="footer-brand">
          <img src="/logo.png" alt="MIS-AI" className="footer-logo" />
          <p className="footer-tagline">
            AI-Powered Mathematical Intelligence System
          </p>
        </div>

        {/* Quick links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
        </div>

        {/* Contact */}
        <div className="footer-links">
          <h4>Contact</h4>
          <a href="mailto:fdp@inmpa.com">fdp@inmpa.com</a>
          <a href="tel:+919994326512">+91 99943 26512</a>
          <span>Infinity Research and Development Institute</span>
          <span>Eachanari, Coimbatore, TN 641021, India</span>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} MIS-AI — Mathematical Intelligence System. All rights reserved.</p>
      </div>
    </footer>
  );
}
