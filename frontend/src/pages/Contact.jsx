/* ─── Contact.jsx — Contact form with validation ──────────── */
import { useState } from "react";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] },
});

const INITIAL = { name: "", email: "", subject: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.message.trim()) e.message = "Message is required";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setSubmitted(true);
      setForm(INITIAL);
    }
  };

  const handleChange = (field) => (ev) => {
    setForm((f) => ({ ...f, [field]: ev.target.value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  return (
    <div className="page-container">
      <section className="page-hero">
        <motion.h1 className="page-hero-title" {...fadeUp(0)}>
          <span className="text-gradient">Contact Us</span>
        </motion.h1>
        <motion.p className="page-hero-desc" {...fadeUp(0.1)}>
          Have questions? We'd love to hear from you.
        </motion.p>
      </section>

      <section className="content-section">
        <div className="contact-grid">
          {/* Info cards */}
          <motion.div className="contact-info" {...fadeUp(0.1)}>
            <div className="glass-card contact-info-card">
              <span className="contact-icon">📧</span>
              <h3>Email</h3>
              <a href="mailto:info@ganitra.org">info@ganitra.org</a>
            </div>
            <div className="glass-card contact-info-card">
              <span className="contact-icon">📞</span>
              <h3>Phone</h3>
              <a href="tel:+919876543210">+91 98765 43210</a>
            </div>
            <div className="glass-card contact-info-card">
              <span className="contact-icon">📍</span>
              <h3>Location</h3>
              <p>Department of Mathematics</p>
            </div>
          </motion.div>

          {/* Form */}
          <motion.form className="glass-card contact-form" onSubmit={handleSubmit} {...fadeUp(0.2)} noValidate>
            {submitted && (
              <div className="form-success">
                ✅ Message sent successfully! We'll get back to you soon.
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                id="name" type="text" placeholder="Your name"
                value={form.name} onChange={handleChange("name")}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email" type="email" placeholder="you@university.edu"
                value={form.email} onChange={handleChange("email")}
                className={errors.email ? "input-error" : ""}
              />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                id="subject" type="text" placeholder="How can we help?"
                value={form.subject} onChange={handleChange("subject")}
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message" rows="5" placeholder="Your message…"
                value={form.message} onChange={handleChange("message")}
                className={errors.message ? "input-error" : ""}
              />
              {errors.message && <span className="field-error">{errors.message}</span>}
            </div>

            <button type="submit" className="btn-hero-primary" style={{ width: "100%" }}>
              Send Message
            </button>
          </motion.form>
        </div>
      </section>
    </div>
  );
}
