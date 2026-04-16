import { motion } from "framer-motion";

/**
 * UploadProgressBar — animated gradient progress bar with percentage text.
 *
 * Props:
 *   progress — 0–100 number
 */
export default function UploadProgressBar({ progress }) {
  const pct = Math.round(progress);

  return (
    <div className="upload-progress">
      <div className="upload-progress__track">
        <motion.div
          className="upload-progress__bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </div>
      <motion.span
        className="upload-progress__pct"
        key={pct}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {pct}%
      </motion.span>
    </div>
  );
}
