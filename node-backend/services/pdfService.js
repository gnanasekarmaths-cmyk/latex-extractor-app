/**
 * PDF service — file persistence + text extraction via pdfjs-dist.
 *
 * Mirrors the Python backend's pdf_service.py functionality using
 * pdfjs-dist (same library the React frontend uses via react-pdf).
 *
 * Coordinate system
 * -----------------
 * The frontend sends coordinates in PDF user-space points (1/72 in),
 * with a top-left origin and Y-down convention (matching pdf.js viewport).
 *
 * pdfjs-dist's getTextContent() returns item positions in the page's
 * default coordinate space (bottom-left origin, Y-up). We use the
 * viewport transform to convert to the frontend's coordinate system.
 */

const fs = require("fs");
const path = require("path");
const config = require("../config");

// pdfjs-dist legacy build for Node.js (no worker needed)
const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");

/**
 * Persist raw PDF bytes to the uploads directory.
 * @param {Buffer} content  PDF file bytes
 * @param {string} fileId   UUID identifier
 * @returns {string}        Full path to saved file
 */
function saveUploadFile(content, fileId) {
  const dest = path.join(config.UPLOAD_DIR, `${fileId}.pdf`);
  fs.writeFileSync(dest, content);
  return dest;
}

/**
 * Return the full path to a previously saved PDF, or null if missing.
 * @param {string} fileId   UUID identifier (without .pdf extension)
 * @returns {string|null}
 */
function getUploadPath(fileId) {
  const candidate = path.join(config.UPLOAD_DIR, `${fileId}.pdf`);
  return fs.existsSync(candidate) ? candidate : null;
}

/**
 * Transform a point from PDF default coords to viewport coords.
 * @param {number[]} matrix  6-element affine transform [a, b, c, d, tx, ty]
 * @param {number} x
 * @param {number} y
 * @returns {number[]}       [viewX, viewY]
 */
function transformPoint(matrix, x, y) {
  return [
    matrix[0] * x + matrix[2] * y + matrix[4],
    matrix[1] * x + matrix[3] * y + matrix[5],
  ];
}

/**
 * Load a PDF document from disk.
 * @param {string} pdfPath  Absolute path to PDF file
 * @returns {Promise<import('pdfjs-dist').PDFDocumentProxy>}
 */
async function loadDocument(pdfPath) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  return pdfjsLib.getDocument({ data, disableWorker: true }).promise;
}

/**
 * Extract text from a specific rectangular region on a PDF page.
 *
 * @param {string} pdfPath     Path to the PDF file
 * @param {number} pageNumber  1-indexed page number
 * @param {number} x           Selection X (from left, in PDF points)
 * @param {number} y           Selection Y (from top, in PDF points)
 * @param {number} width       Selection width (in PDF points)
 * @param {number} height      Selection height (in PDF points)
 * @returns {Promise<string>}  Extracted text from the region
 */
async function extractRegionText(pdfPath, pageNumber, x, y, width, height) {
  const doc = await loadDocument(pdfPath);

  if (pageNumber > doc.numPages) {
    throw Object.assign(
      new Error(`Page ${pageNumber} exceeds document length (${doc.numPages}).`),
      { statusCode: 422 },
    );
  }

  const page = await doc.getPage(pageNumber); // 1-indexed
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  // Selection bounding box in viewport coords (top-left, Y-down)
  const selLeft = x;
  const selTop = y;
  const selRight = x + width;
  const selBottom = y + height;

  const PAD = 3; // tolerance in PDF points

  const matchedItems = [];

  for (const item of textContent.items) {
    if (!item.str || !item.str.trim()) continue;

    // Transform text position from PDF space → viewport space
    const [vx, vy] = transformPoint(
      viewport.transform,
      item.transform[4],
      item.transform[5],
    );

    // Check if the text item falls within the selection region
    // vx is the left edge of the text; vy is near the baseline
    const itemRight = vx + (item.width || 0);

    if (
      itemRight >= selLeft - PAD &&
      vx <= selRight + PAD &&
      vy >= selTop - PAD &&
      vy <= selBottom + PAD
    ) {
      matchedItems.push({ ...item, vx, vy });
    }
  }

  // Sort by position: top → bottom, then left → right
  matchedItems.sort((a, b) => {
    const yDiff = a.vy - b.vy;
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.vx - b.vx;
  });

  // Group items into lines based on Y proximity
  const lines = [];
  let currentLine = [];
  let lastY = null;

  for (const item of matchedItems) {
    if (lastY !== null && Math.abs(item.vy - lastY) > 5) {
      lines.push(currentLine.map((i) => i.str).join(" "));
      currentLine = [];
    }
    currentLine.push(item);
    lastY = item.vy;
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.map((i) => i.str).join(" "));
  }

  return lines.join("\n");
}

/**
 * Extract all text from a single PDF page.
 *
 * @param {string} pdfPath     Path to the PDF file
 * @param {number} pageNumber  1-indexed page number
 * @returns {Promise<{text: string, charCount: number, paragraphCount: number}>}
 */
async function extractFullPageText(pdfPath, pageNumber) {
  const doc = await loadDocument(pdfPath);

  if (pageNumber > doc.numPages) {
    throw Object.assign(
      new Error(`Page ${pageNumber} exceeds document length (${doc.numPages}).`),
      { statusCode: 422 },
    );
  }

  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  // Group text items into lines based on Y position
  const lineMap = new Map(); // rounded Y → items[]

  for (const item of textContent.items) {
    if (!item.str) continue;
    const [vx, vy] = transformPoint(
      viewport.transform,
      item.transform[4],
      item.transform[5],
    );
    // Round to nearest 2pt to group items on the same line
    const lineKey = Math.round(vy / 2) * 2;
    if (!lineMap.has(lineKey)) lineMap.set(lineKey, []);
    lineMap.get(lineKey).push({ str: item.str, vx });
  }

  // Sort lines by Y position, items within each line by X
  const sortedKeys = [...lineMap.keys()].sort((a, b) => a - b);
  const paragraphs = [];
  let currentParagraph = [];
  let lastLineY = null;

  for (const key of sortedKeys) {
    const items = lineMap.get(key).sort((a, b) => a.vx - b.vx);
    const lineText = items.map((i) => i.str).join(" ").trim();
    if (!lineText) continue;

    // Detect paragraph breaks: gap > 12pt between lines
    if (lastLineY !== null && Math.abs(key - lastLineY) > 12) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
    }

    currentParagraph.push(lineText);
    lastLineY = key;
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(" "));
  }

  const fullText = paragraphs.join("\n\n");

  return {
    text: fullText,
    charCount: fullText.length,
    paragraphCount: paragraphs.length,
  };
}

module.exports = {
  saveUploadFile,
  getUploadPath,
  extractRegionText,
  extractFullPageText,
};
