"""
Page-text route — extracts the full text content of a PDF page using
PyMuPDF's built-in text extraction (no OCR needed).

This is a lightweight alternative to the crop→OCR pipeline when the
PDF contains embedded text (selectable). For scanned PDFs or image-only
pages, the text layer will be empty and the client should fall back to
the OCR-based extraction.

Premium feature: "Convert Entire Page" — extracts all paragraphs and
mathematical content from a full page in one click.

Future extension point: integrate an AI model (GPT-4V, Nougat, etc.)
to parse page images for perfect LaTeX conversion of complex layouts.
"""

import logging
import time

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from services.pdf_service import get_upload_path

router = APIRouter(tags=["page-text"])
logger = logging.getLogger("backend.page_text")


@router.post("/extract-page-text")
async def extract_page_text(
    filename: str = Form(..., description="file_id returned by /upload"),
    page_number: int = Form(..., ge=1),
):
    """
    Extract the full embedded text from a single PDF page.

    Returns the raw text with paragraph breaks preserved.  The frontend
    applies `normalizeSymbols()` to convert Unicode math glyphs to LaTeX.

    Response
    --------
    {
      "text": "...",
      "page_number": 1,
      "char_count": 1234,
      "status": "success"
    }
    """
    t0 = time.perf_counter()
    logger.info("extract-page-text  filename=%s  page=%d", filename, page_number)

    # --- Resolve uploaded file ---
    pdf_path = get_upload_path(filename, settings.UPLOAD_DIR)
    if pdf_path is None:
        raise HTTPException(
            status_code=404,
            detail="Upload not found. Upload the PDF first via /upload.",
        )

    try:
        import fitz  # PyMuPDF

        doc = fitz.open(pdf_path)
        try:
            if page_number > doc.page_count:
                raise ValueError(
                    f"page_number {page_number} exceeds document length ({doc.page_count})."
                )

            page = doc.load_page(page_number - 1)

            # "blocks" mode returns paragraphs with positions, preserving layout
            # Each block is (x0, y0, x1, y1, "text", block_no, block_type)
            # block_type 0 = text, 1 = image
            blocks = page.get_text("blocks")

            # Sort blocks by vertical position (top→bottom), then left→right
            text_blocks = [b for b in blocks if b[6] == 0]  # text blocks only
            text_blocks.sort(key=lambda b: (round(b[1] / 10) * 10, b[0]))

            # Join paragraphs with double newlines to preserve structure
            paragraphs = [b[4].strip() for b in text_blocks if b[4].strip()]
            full_text = "\n\n".join(paragraphs)

            elapsed = time.perf_counter() - t0
            logger.info(
                "Page text extracted in %.2fs — %d chars, %d paragraphs.",
                elapsed, len(full_text), len(paragraphs),
            )

            return JSONResponse({
                "text": full_text,
                "page_number": page_number,
                "char_count": len(full_text),
                "paragraph_count": len(paragraphs),
                "status": "success",
            })

        finally:
            doc.close()

    except ValueError as exc:
        logger.error("Validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError as exc:
        logger.error("File error: %s", exc)
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected error extracting page text")
        raise HTTPException(status_code=500, detail="Failed to extract page text.")


# ---------------------------------------------------------------------------
# Future premium endpoint stub: AI-powered full-page conversion
# ---------------------------------------------------------------------------
# @router.post("/convert-page-ai")
# async def convert_page_ai(
#     filename: str = Form(...),
#     page_number: int = Form(..., ge=1),
# ):
#     """
#     [PREMIUM] AI-powered full-page LaTeX conversion.
#
#     Uses a vision-language model (e.g. GPT-4V, Nougat, or a fine-tuned
#     model) to parse the entire page image — including complex layouts,
#     tables, matrices, and multi-line equations — into perfect LaTeX.
#
#     This endpoint is gated behind premium authentication.  To enable:
#       1. Verify the user's subscription tier via auth middleware.
#       2. Render the full page to a high-res image (zoom=4).
#       3. Send the image to the AI model endpoint.
#       4. Return the structured LaTeX output.
#
#     Integration points:
#       - OpenAI GPT-4V: send as base64 image in a chat completion
#       - Meta Nougat: local model, academic PDF → LaTeX
#       - Custom fine-tuned model: self-hosted for privacy
#     """
#     pass
