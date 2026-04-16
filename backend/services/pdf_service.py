"""
PDF service — file persistence + region cropping via PyMuPDF.

Coordinate system
-----------------
Both pdf.js and PyMuPDF use a **top-left origin, Y-down** convention,
so no Y-axis flip is needed between frontend and backend.

However, the two libraries disagree on *which* (0,0) they reference:

  • **pdf.js** `getViewport({scale:1})` returns dimensions of the *visible*
    page area (CropBox).  Coordinate (0, 0) corresponds to the top-left of
    the CropBox.  These are the coordinates the frontend sends.

  • **PyMuPDF** `page.rect` may have a non-zero origin.  For a PDF whose
    CropBox is [72, 72, 540, 720], `page.rect = Rect(72, 72, 540, 720)`.
    The `clip` parameter of `page.get_pixmap()` uses these *absolute*
    coordinates.

Therefore `crop_pdf_region` adds `(page.rect.x0, page.rect.y0)` to the
frontend coordinates before building the clip rectangle.
"""

import logging
from pathlib import Path
from uuid import uuid4

import fitz  # PyMuPDF

logger = logging.getLogger("backend.services.pdf")


# ---------------------------------------------------------------------------
# Upload helpers
# ---------------------------------------------------------------------------

def save_upload_file(content: bytes, file_id: str, upload_dir: Path) -> Path:
    """Persist raw PDF bytes to *upload_dir*/<file_id>.pdf."""
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"{file_id}.pdf"
    dest.write_bytes(content)
    return dest


def get_upload_path(file_id: str, upload_dir: Path) -> Path | None:
    """Return the Path to a previously saved PDF, or None if missing."""
    candidate = upload_dir / f"{file_id}.pdf"
    return candidate if candidate.is_file() else None


# ---------------------------------------------------------------------------
# Crop helpers
# ---------------------------------------------------------------------------

def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* into [lo, hi]."""
    return max(lo, min(value, hi))


def build_crop_rect(
    x1: float, y1: float, x2: float, y2: float, page: fitz.Page
) -> fitz.Rect:
    """
    Build a fitz.Rect from two corner points, clamped to page bounds.

    Coordinates must be in **absolute PDF space** (i.e. relative to the
    MediaBox origin, not the visible-area origin).  Use the offset
    applied in `crop_pdf_region` to translate frontend coordinates.

    Accepts corners in any order — the function normalises them so that
    (x1, y1) is always the top-left and (x2, y2) the bottom-right.

    Raises ValueError if the resulting rectangle has zero or negative area.
    """
    pr = page.rect  # actual page rectangle in PDF points (may have non-zero origin)

    # Normalise so x1 < x2 and y1 < y2, clamp to actual page bounds
    left   = _clamp(min(x1, x2), pr.x0, pr.x1)
    top    = _clamp(min(y1, y2), pr.y0, pr.y1)
    right  = _clamp(max(x1, x2), pr.x0, pr.x1)
    bottom = _clamp(max(y1, y2), pr.y0, pr.y1)

    if right <= left or bottom <= top:
        raise ValueError(
            f"Crop region collapses to zero area after clamping to page bounds "
            f"({pr.width:.1f}×{pr.height:.1f} pt, origin ({pr.x0:.1f}, {pr.y0:.1f})).  "
            f"Requested: ({x1:.1f}, {y1:.1f}) → ({x2:.1f}, {y2:.1f})."
        )

    rect = fitz.Rect(left, top, right, bottom)
    logger.debug(
        "Crop rect: (%.1f, %.1f, %.1f, %.1f) on page %s",
        left, top, right, bottom, pr,
    )
    return rect


def crop_pdf_region(
    pdf_path: Path,
    page_number: int,
    x: float,
    y: float,
    width: float,
    height: float,
    output_dir: Path,
    page_width: float | None = None,
    page_height: float | None = None,
    zoom: float = 3.0,
) -> Path:
    """
    Rasterise the bounding-box region of *page_number* and save as PNG.

    The bounding box can be specified in two ways — both are supported:

      • **origin + size** (current default):  x, y, width, height
        Internally converted to corner form (x, y, x+width, y+height).

      • **two corners**:  call `build_crop_rect(x1, y1, x2, y2, page)` directly.

    Parameters
    ----------
    zoom : float
        Render scale factor applied to both axes.  Higher values produce
        sharper crops which improve OCR accuracy at the cost of memory.

        Approximate output DPI ≈ 72 × zoom.  So zoom=3 → ~216 DPI,
        zoom=4 → ~288 DPI.  Default is 3× (good balance for pix2tex).
    """
    logger.info(
        "crop_pdf_region  file=%s  page=%d  box=(%.1f, %.1f, %.1f, %.1f)  zoom=%.1f",
        pdf_path.name, page_number, x, y, width, height, zoom,
    )

    if page_number < 1:
        raise ValueError("page_number must be ≥ 1.")

    doc = fitz.open(pdf_path)
    try:
        if page_number > doc.page_count:
            raise ValueError(
                f"page_number {page_number} exceeds document length ({doc.page_count})."
            )

        page = doc.load_page(page_number - 1)

        # Sanity-check: frontend-reported dims should match the real page
        if page_width is not None and abs(page_width - page.rect.width) > 2.0:
            raise ValueError(
                f"Reported page_width ({page_width:.1f}) does not match "
                f"actual PDF page width ({page.rect.width:.1f})."
            )
        if page_height is not None and abs(page_height - page.rect.height) > 2.0:
            raise ValueError(
                f"Reported page_height ({page_height:.1f}) does not match "
                f"actual PDF page height ({page.rect.height:.1f})."
            )

        # The frontend sends coordinates relative to the visible area
        # (0,0 = top-left of what pdf.js renders).  PyMuPDF's clip rect
        # operates in absolute page coordinates, so we must offset by the
        # page.rect origin which may be non-zero for PDFs with CropBox /
        # MediaBox offsets.
        ox, oy = page.rect.x0, page.rect.y0

        # Convert origin+size → two-corner form in absolute coordinates
        clip = build_crop_rect(
            x + ox, y + oy,
            x + width + ox, y + height + oy,
            page,
        )

        # Render at high resolution
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)

        output_dir.mkdir(parents=True, exist_ok=True)
        out_path = output_dir / f"crop_{uuid4().hex}.png"
        pix.save(str(out_path))

        logger.info(
            "Cropped image saved: %s  (%d×%d px, ~%d DPI)",
            out_path.name, pix.width, pix.height, int(72 * zoom),
        )
        return out_path
    finally:
        doc.close()
    return out_path
