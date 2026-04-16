import { useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import UploadDropzone from "./UploadDropzone";
import FilePreviewCard from "./FilePreviewCard";

/**
 * UploadZone — orchestrates the upload flow by composing:
 *   UploadDropzone  → drag-and-drop / click-to-upload
 *   FilePreviewCard → file info + UploadProgressBar
 *   Success state   → checkmark after upload completes
 *
 * Props:
 *   onFile(file)   — called with the selected File object
 *   uploading      — boolean, true while the parent is uploading
 *   uploadDone     — boolean, true after upload succeeds
 */
export default function UploadZone({ onFile, uploading, uploadDone }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fakeProgress, setFakeProgress] = useState(0);

  /* ── Fake progress while uploading ──────────────────────────── */
  useEffect(() => {
    if (!uploading) {
      if (uploadDone) setFakeProgress(100);
      return;
    }
    setFakeProgress(0);
    let frame;
    let start;
    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const pct = Math.min(90, 90 * (1 - Math.exp(-elapsed / 1200)));
      setFakeProgress(pct);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [uploading, uploadDone]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleFile = useCallback(
    (f) => {
      setSelectedFile(f);
      onFile(f);
    },
    [onFile],
  );

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setFakeProgress(0);
  }, []);

  const showDropZone = !selectedFile && !uploading && !uploadDone;
  const showFileCard = selectedFile && !uploadDone;
  const showSuccess = uploadDone;

  return (
    <div className="upload-zone-inner">
      <AnimatePresence mode="wait">
        {showDropZone && (
          <UploadDropzone key="dropzone" onFile={handleFile} />
        )}

        {showFileCard && (
          <FilePreviewCard
            key="filecard"
            file={selectedFile}
            uploading={uploading}
            progress={fakeProgress}
            onRemove={removeFile}
          />
        )}

        {showSuccess && (
          <motion.div
            key="success"
            className="upload-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <motion.div
              className="upload-success__check"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </motion.div>
            <p className="upload-success__text">PDF uploaded successfully</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
