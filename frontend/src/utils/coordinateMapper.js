/**
 * coordinateMapper — converts a canvas-pixel selection rectangle to
 * PDF user-space points (1 pt = 1/72 in).
 *
 * Coordinate systems
 * ------------------
 * Both the browser canvas and pdf.js use a **top-left origin, Y-down**
 * convention, so no Y-axis flip is needed.
 *
 * pdf.js `getViewport({scale:1})` reports the *visible area* dimensions
 * (CropBox).  The canvas is rendered at `scale`, so:
 *
 *     canvasWidth  = pdfWidth  × scale
 *     canvasHeight = pdfHeight × scale
 *
 * This function divides by that ratio to recover PDF points.  The backend
 * then offsets by `page.rect.x0 / .y0` to handle any CropBox origin.
 *
 * @param {Object} canvas       Canvas dimensions.
 * @param {number} canvas.width   Rendered canvas width in CSS pixels.
 * @param {number} canvas.height  Rendered canvas height in CSS pixels.
 *
 * @param {Object} pdf          Original PDF page dimensions (scale = 1).
 * @param {number} pdf.width      Page width in PDF points.
 * @param {number} pdf.height     Page height in PDF points.
 *
 * @param {Object} selection    Selection rectangle in canvas pixels.
 * @param {number} selection.x1   Left   edge (px).
 * @param {number} selection.y1   Top    edge (px).
 * @param {number} selection.x2   Right  edge (px).
 * @param {number} selection.y2   Bottom edge (px).
 *
 * @returns {{ x: number, y: number, width: number, height: number,
 *             page_width: number, page_height: number }}
 *   Bounding box in PDF points (relative to visible-area origin) plus
 *   the page dimensions the backend uses for sanity-checking.
 *
 * @throws {Error} If any dimension is zero or negative (prevents division-by-zero).
 */
export function canvasToPdfCoords(canvas, pdf, selection) {
  if (canvas.width <= 0 || canvas.height <= 0) {
    throw new Error("Canvas dimensions must be positive.");
  }
  if (pdf.width <= 0 || pdf.height <= 0) {
    throw new Error("PDF dimensions must be positive.");
  }

  // Independent per-axis ratio — keeps aspect ratio intact and avoids distortion.
  const rx = pdf.width / canvas.width;
  const ry = pdf.height / canvas.height;

  return {
    x: selection.x1 * rx,
    y: selection.y1 * ry,
    width: (selection.x2 - selection.x1) * rx,
    height: (selection.y2 - selection.y1) * ry,
    page_width: pdf.width,
    page_height: pdf.height,
  };
}
