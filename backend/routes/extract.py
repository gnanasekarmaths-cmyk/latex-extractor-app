"""
Extract route — receives a filename + bounding-box coordinates,
crops the PDF region, runs the preprocessing → pix2tex OCR pipeline,
and returns exact LaTeX with a status field.
"""

import asyncio
import logging
import time

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from services.pdf_service import get_upload_path, crop_pdf_region
from services.ocr_service import get_latex

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
    Full extraction pipeline:
      1. Resolve PDF from *filename* (== file_id from /upload)
      2. Crop bounding-box region via PyMuPDF
      3. Preprocess image (grayscale → contrast → 2× upscale → denoise)
      4. Run pix2tex OCR
      5. Return exact LaTeX — no correction, no simplification
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

    image_path = None
    try:
        # --- 2. Crop the selected region from the PDF page --------------------
        logger.info("Cropping page %d …", page_number)
        image_path = crop_pdf_region(
            pdf_path=pdf_path,
            page_number=page_number,
            x=x,
            y=y,
            width=width,
            height=height,
            page_width=page_width,
            page_height=page_height,
            output_dir=settings.TEMP_DIR,
        )

        # --- 3 + 4. Preprocess + OCR (handled inside get_latex → model) ------
        logger.info("Running OCR pipeline …")
        latex_text = await asyncio.wait_for(
            asyncio.to_thread(get_latex, image_path, settings.MODEL_DEVICE),
            timeout=settings.OCR_TIMEOUT_SECONDS,
        )

        elapsed = time.perf_counter() - t0
        logger.info("Extraction succeeded in %.2fs — %d chars.", elapsed, len(latex_text))

        # --- 5. Return exact LaTeX --------------------------------------------
        return JSONResponse({
            "latex": latex_text,
            "status": "success",
        })

    except (asyncio.TimeoutError, TimeoutError):
        logger.error("OCR timed out after %ds", settings.OCR_TIMEOUT_SECONDS)
        raise HTTPException(
            status_code=504,
            detail=f"OCR timed out after {settings.OCR_TIMEOUT_SECONDS}s — try a smaller selection.",
        )
    except ValueError as exc:
        logger.error("Validation error: %s", exc)
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError as exc:
        logger.error("File error: %s", exc)
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        logger.error("OCR error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected extraction error")
        raise HTTPException(status_code=500, detail="Unexpected extraction error.")
    finally:
        # Clean up the temporary cropped image; keep the uploaded PDF
        if image_path and image_path.exists():
            try:
                image_path.unlink()
                logger.debug("Removed temp crop %s", image_path)
            except OSError:
                logger.warning("Could not remove temp crop %s", image_path)
