import { motion } from "framer-motion";
import UploadProgressBar from "./UploadProgressBar";

/**
 * FilePreviewCard — glassmorphism card showing file info with optional progress.
 *
 * Props:
 *   file       — File object
 *   uploading  — boolean
 *   progress   — 0–100 number
 *   onRemove() — resets upload state
 */
export default function FilePreviewCard({ file, uploading, progress, onRemove }) {
  return (
    <motion.div
      className="upload-filecard"
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -14, scale: 0.97 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* File icon */}
      <div className="upload-filecard__icon">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      </div>

      {/* File info */}
      <div className="upload-filecard__info">
        <span className="upload-filecard__name">{file.name}</span>
        <span className="upload-filecard__size">{formatSize(file.size)}</span>
      </div>

      {/* Remove button (hidden while uploading) */}
      {!uploading && (
        <motion.button
          className="upload-filecard__remove"
          onClick={onRemove}
          aria-label="Remove file"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </motion.button>
      )}

      {/* Progress bar */}
      {uploading && <UploadProgressBar progress={progress} />}
    </motion.div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
