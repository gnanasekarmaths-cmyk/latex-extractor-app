/**
 * Upload route — receives a PDF file, persists it with a UUID filename,
 * and returns an identifier that downstream routes can reference.
 */

const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { saveUploadFile } = require("../services/pdfService");

const router = express.Router();

// Multer: store in memory buffer, enforce size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.UPLOAD_MAX_SIZE_MB * 1024 * 1024 },
});

router.post("/upload", upload.single("file"), (req, res) => {
  const file = req.file;

  // Also accept "pdf_file" key for backward compatibility
  if (!file) {
    return res.status(400).json({
      success: false,
      latex: "",
      message: "No file uploaded. Send as 'file' or 'pdf_file'.",
    });
  }

  console.log(`[upload] Received: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);

  // Content-type guard
  if (!file.mimetype || !file.mimetype.toLowerCase().includes("pdf")) {
    return res.status(415).json({
      success: false,
      latex: "",
      message: "Uploaded file must be a PDF.",
    });
  }

  // Empty file guard
  if (file.size === 0) {
    return res.status(400).json({
      success: false,
      latex: "",
      message: "Uploaded file is empty.",
    });
  }

  const fileId = uuidv4().replace(/-/g, "");
  try {
    const savedPath = saveUploadFile(file.buffer, fileId);
    console.log(`[upload] Saved: ${fileId} → ${savedPath}`);

    return res.json({
      success: true,
      file_id: fileId,
      stored_filename: `${fileId}.pdf`,
      original_filename: file.originalname,
      message: "Upload successful",
    });
  } catch (err) {
    console.error("[upload] Save failed:", err.message);
    return res.status(500).json({
      success: false,
      latex: "",
      message: "Failed to save uploaded file.",
    });
  }
});

// Handle multer size limit errors
router.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      latex: "",
      message: `File exceeds ${config.UPLOAD_MAX_SIZE_MB} MB limit.`,
    });
  }
  return res.status(500).json({
    success: false,
    latex: "",
    message: err.message || "Upload error.",
  });
});

module.exports = router;
