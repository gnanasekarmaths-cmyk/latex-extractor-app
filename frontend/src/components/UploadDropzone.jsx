import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

/**
 * UploadDropzone — drag-and-drop zone + click-to-upload for PDFs.
 *
 * Props:
 *   onFile(file) — called with the accepted File
 */
export default function UploadDropzone({ onFile }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [sizeError, setSizeError] = useState("");

  const accept = useCallback(
    (f) => {
      setSizeError("");
      if (!f) return;
      if (f.type !== "application/pdf") {
        setSizeError("Only PDF files are accepted.");
        return;
      }
      if (f.size > MAX_SIZE) {
        setSizeError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 50 MB.`);
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      accept(e.dataTransfer?.files?.[0]);
    },
    [accept],
  );

  const handleChange = useCallback(
    (e) => accept(e.target.files?.[0]),
    [accept],
  );

  return (
    <motion.div
      className="upload-dropzone"
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: dragActive ? 1.03 : 1,
        borderColor: dragActive
          ? "rgba(124, 58, 237, 0.8)"
          : "rgba(255, 255, 255, 0.1)",
        backgroundColor: dragActive
          ? "rgba(124, 58, 237, 0.1)"
          : "rgba(15, 23, 42, 0.72)",
        boxShadow: dragActive
          ? "0 0 40px rgba(124, 58, 237, 0.2), 0 0 80px rgba(124, 58, 237, 0.08), inset 0 0 40px rgba(124, 58, 237, 0.06)"
          : "0 0 0px rgba(124, 58, 237, 0), 0 0 0px rgba(124, 58, 237, 0), inset 0 0 0px rgba(124, 58, 237, 0)",
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <motion.div
        className="upload-icon"
        animate={dragActive ? { y: -8, scale: 1.15 } : { y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </motion.div>

      <p className="upload-label">
        Drag &amp; Drop PDF or{" "}
        <span className="upload-label-accent">Click to Upload</span>
      </p>
      <p className="upload-hint">PDF files only · Max 50 MB</p>
      {sizeError && (
        <p className="upload-error" style={{ color: "var(--color-error)", fontSize: "0.82rem", marginTop: 6, fontWeight: 500 }}>
          {sizeError}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        onChange={handleChange}
      />
    </motion.div>
  );
}
