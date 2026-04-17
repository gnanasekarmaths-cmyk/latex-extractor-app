"""
Extract route — receives a filename + bounding-box coordinates,
crops the region as a high-res image, sends it to the Hugging Face
pix2tex Inference API, and returns the LaTeX result.
"""

import logging
import time

from fastapi import APIRouter, Form, HTTPException
from fastapi.responses import JSONResponse

from config import settings
from services.pdf_service import get_upload_path, crop_pdf_region
from services.gemini_service import predict_latex

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
    HF Inference API extraction pipeline:
      1. Resolve PDF from *filename* (== file_id from /upload)
      2. Crop the selected region as a high-res PNG via PyMuPDF
      3. Send the image to HF pix2tex model for LaTeX prediction
      4. Clean up temp image and return LaTeX
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

    crop_path = None
    try:
        # --- 2. Crop region as high-res PNG -----------------------------------
        logger.info("Cropping region from page %d …", page_number)
        crop_path = crop_pdf_region(
            pdf_path=pdf_path,
            page_number=page_number,
            x=x,
            y=y,
            width=width,
            height=height,
            output_dir=settings.TEMP_DIR,
            page_width=page_width,
            page_height=page_height,
            zoom=3.0,
        )

        # --- 3. Send to HF Inference API -------------------------------------
        image_bytes = crop_path.read_bytes()
        logger.info("Sending %d-byte image to HF pix2tex …", len(image_bytes))

        latex_text = await predict_latex(
            image_bytes=image_bytes,
            api_key=settings.GEMINI_API_KEY,
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
    except RuntimeError as exc:
        logger.error("HF API error: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.exception("Unexpected extraction error")
        raise HTTPException(status_code=500, detail="Unexpected extraction error.")
    finally:
        # Clean up temp crop file
        if crop_path and crop_path.exists():
            try:
                crop_path.unlink()
            except OSError:
                pass
