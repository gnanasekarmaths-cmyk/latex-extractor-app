/**
 * Extract route — receives a filename + bounding-box coordinates,
 * extracts text from the PDF region using pdfjs-dist, normalizes
 * Unicode math symbols to LaTeX, and returns the result.
 *
 * For PDFs with embedded text (selectable), this provides accurate
 * LaTeX conversion. For scanned/image-only PDFs, the text layer
 * will be empty — consider integrating Tesseract.js or an external
 * OCR API for those cases.
 */

const express = require("express");
const multer = require("multer");
const config = require("../config");
const { getUploadPath, extractRegionText } = require("../services/pdfService");
const { normalizeSymbols } = require("../utils/normalizeSymbols");

const router = express.Router();
const formParser = multer().none(); // parse multipart form fields only

router.post("/extract-equation", formParser, async (req, res) => {
  const t0 = performance.now();
  const { filename, page_number, x, y, width, height, page_width, page_height } = req.body;

  console.log(
    `[extract] filename=${filename} page=${page_number} box=(${x}, ${y}, ${width}, ${height})`,
  );

  // ── Validate required fields ──────────────────────────────────
  if (!filename) {
    return res.status(400).json({
      success: false,
      latex: "",
      message: "Missing 'filename' (file_id from /upload).",
    });
  }

  const pageNum = parseInt(page_number, 10);
  const selX = parseFloat(x);
  const selY = parseFloat(y);
  const selW = parseFloat(width);
  const selH = parseFloat(height);

  if (!pageNum || pageNum < 1) {
    return res.status(422).json({
      success: false,
      latex: "",
      message: "Invalid page_number — must be a positive integer.",
    });
  }

  if ([selX, selY, selW, selH].some((v) => isNaN(v)) || selW <= 0 || selH <= 0) {
    return res.status(422).json({
      success: false,
      latex: "",
      message: "Invalid selection coordinates — all values must be numbers, width/height > 0.",
    });
  }

  // ── Resolve uploaded file ─────────────────────────────────────
  const pdfPath = getUploadPath(filename);
  if (!pdfPath) {
    return res.status(404).json({
      success: false,
      latex: "",
      message: "Upload not found. Upload the PDF first via /upload.",
    });
  }

  try {
    // ── Extract text from the selected region ───────────────────
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(Object.assign(new Error("Extraction timed out"), { statusCode: 504 })),
        config.OCR_TIMEOUT_MS,
      ),
    );

    const rawText = await Promise.race([
      extractRegionText(pdfPath, pageNum, selX, selY, selW, selH),
      timeoutPromise,
    ]);

    if (!rawText || !rawText.trim()) {
      const elapsed = (performance.now() - t0).toFixed(0);
      console.log(`[extract] No text found in region (${elapsed} ms)`);
      return res.json({
        success: true,
        latex: "",
        message:
          "No selectable text found in the selected region. " +
          "The PDF may contain scanned images — try selecting a region with embedded text.",
      });
    }

    // ── Normalize Unicode math → LaTeX ──────────────────────────
    const latex = normalizeSymbols(rawText);

    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[extract] Success in ${elapsed} ms — ${latex.length} chars`);

    return res.json({
      success: true,
      latex,
      message: "Extraction complete",
    });
  } catch (err) {
    const elapsed = (performance.now() - t0).toFixed(0);
    console.error(`[extract] Failed after ${elapsed} ms:`, err.message);

    const status = err.statusCode || 500;

    if (status === 504) {
      return res.status(504).json({
        success: false,
        latex: "",
        message: `Extraction timed out after ${config.OCR_TIMEOUT_MS / 1000}s — try a smaller selection.`,
      });
    }

    return res.status(status).json({
      success: false,
      latex: "",
      message: err.message || "Extraction failed — an unexpected error occurred.",
    });
  }
});

module.exports = router;
