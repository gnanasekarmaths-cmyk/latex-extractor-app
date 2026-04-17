"""
Extract route — receives a filename + bounding-box coordinates,
extracts text from the PDF region using PyMuPDF, normalises Unicode
math symbols to LaTeX commands, and returns the result.
"""

import logging
import time

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from services.pdf_service import get_upload_path, extract_region_text

router = APIRouter(tags=["extract"])
logger = logging.getLogger("backend.extract")


@router.post("/extract-equation")
async def extract_equation(
    filename: str = Form(..., description="file_id returned by /upload"),
    page_number: int = Form(..., ge=1),
    x: float = Form(..., ge=0),
    y: float = Form(..., ge=0),
    width: float = Form(..., gt=0),
    height: float = Form(..., gt=0),
    page_width: float = Form(..., gt=0),
    page_height: float = Form(..., gt=0),
):
    """
    Text-based extraction pipeline:
      1. Resolve PDF from *filename* (== file_id from /upload)
      2. Extract text from the bounding-box region via PyMuPDF
      3. Normalise Unicode math symbols to LaTeX commands
      4. Return LaTeX text
    """
    t0 = time.perf_counter()
    logger.info(
        "extract-equation  filename=%s  page=%d  box=(%.1f, %.1f, %.1f, %.1f)",
        filename, page_number, x, y, width, height,
    )

    # --- 1. Resolve uploaded file ---------------------------------------------
    pdf_path = get_upload_path(filename, settings.UPLOAD_DIR)
    if pdf_path is None:
        logger.warning("Upload not found: %s", filename)
        raise HTTPException(
            status_code=404,
            detail="Upload not found. Upload the PDF first via /upload.",
        )

    try:
        # --- 2 + 3. Extract text from region and normalise --------------------
        logger.info("Extracting text from page %d …", page_number)
        latex_text = extract_region_text(
            pdf_path=pdf_path,
            page_number=page_number,
            x=x,
            y=y,
            width=width,
            height=height,
            page_width=page_width,
            page_height=page_height,
        )

        elapsed = time.perf_counter() - t0
        logger.info("Extraction succeeded in %.2fs — %d chars.", elapsed, len(latex_text))

        return JSONResponse({
            "latex": latex_text,
            "status": "success",
        })

    except ValueError as exc:
        logger.error("Validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError as exc:
        logger.error("File error: %s", exc)
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected extraction error")
        raise HTTPException(status_code=500, detail="Unexpected extraction error.")
