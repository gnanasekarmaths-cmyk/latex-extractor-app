/**
 * Page-text route — extracts the full text content of a PDF page
 * using pdfjs-dist's built-in text extraction (no OCR needed).
 *
 * Premium feature: "Convert Entire Page" — extracts all paragraphs and
 * mathematical content from a full page in one click.
 */

const express = require("express");
const multer = require("multer");
const { getUploadPath, extractFullPageText } = require("../services/pdfService");

const router = express.Router();
const formParser = multer().none();

router.post("/extract-page-text", formParser, async (req, res) => {
  const t0 = performance.now();
  const { filename, page_number } = req.body;

  console.log(`[page-text] filename=${filename} page=${page_number}`);

  if (!filename) {
    return res.status(400).json({
      success: false,
      latex: "",
      message: "Missing 'filename' (file_id from /upload).",
    });
  }

  const pageNum = parseInt(page_number, 10);
  if (!pageNum || pageNum < 1) {
    return res.status(422).json({
      success: false,
      latex: "",
      message: "Invalid page_number — must be a positive integer.",
    });
  }

  const pdfPath = getUploadPath(filename);
  if (!pdfPath) {
    return res.status(404).json({
      success: false,
      latex: "",
      message: "Upload not found. Upload the PDF first via /upload.",
    });
  }

  try {
    const { text, charCount, paragraphCount } = await extractFullPageText(pdfPath, pageNum);

    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(
      `[page-text] Extracted in ${elapsed} ms — ${charCount} chars, ${paragraphCount} paragraphs`,
    );

    return res.json({
      success: true,
      text,
      page_number: pageNum,
      char_count: charCount,
      paragraph_count: paragraphCount,
      message: "Page text extracted",
    });
  } catch (err) {
    const elapsed = (performance.now() - t0).toFixed(0);
    console.error(`[page-text] Failed after ${elapsed} ms:`, err.message);

    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      latex: "",
      message: err.message || "Page text extraction failed.",
    });
  }
});

module.exports = router;
