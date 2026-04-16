"""
Upload route — receives a PDF file, persists it, and returns a file identifier
that downstream routes (e.g. /extract) can reference.
"""

import logging
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings
from services.pdf_service import save_upload_file

router = APIRouter(tags=["upload"])
logger = logging.getLogger("backend.upload")


@router.post("/upload")
async def upload_pdf(
    file: Optional[UploadFile] = File(None),
    pdf_file: Optional[UploadFile] = File(None),
):
    """
    Accept a PDF upload, store it with a UUID filename, and return identifiers.

    Accepts the file under either the "file" or "pdf_file" form key so both
    the simplified fetch-based frontend and the original axios frontend work.

    Validations:
      - Content-Type must contain 'pdf'
      - File must not be empty
      - File must not exceed UPLOAD_MAX_SIZE_MB
    """
    # Accept whichever key the frontend sent
    upload = file or pdf_file
    if upload is None:
        raise HTTPException(status_code=400, detail="No file uploaded. Send as 'file' or 'pdf_file'.")

    print("File received:", upload.filename)
    logger.info("Received file: %s (content_type=%s)", upload.filename, upload.content_type)

    # --- Content-type guard ---------------------------------------------------
    if not upload.content_type or "pdf" not in upload.content_type.lower():
        raise HTTPException(status_code=415, detail="Uploaded file must be a PDF.")

    # --- Read & size guard ----------------------------------------------------
    content = await upload.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    size_mb = len(content) / (1024 * 1024)
    if size_mb > settings.UPLOAD_MAX_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds {settings.UPLOAD_MAX_SIZE_MB} MB limit.",
        )

    # --- Persist with UUID filename -------------------------------------------
    file_id = uuid4().hex
    try:
        saved_path = save_upload_file(content, file_id, settings.UPLOAD_DIR)
        logger.info("Saved upload %s → %s", file_id, saved_path)
    except Exception:
        logger.exception("Failed to save uploaded PDF")
        raise HTTPException(status_code=500, detail="Failed to save uploaded file.")

    return {
        "message": "Upload success",
        "filename": upload.filename,
        "file_id": file_id,
        "stored_filename": f"{file_id}.pdf",
        "original_filename": upload.filename,
    }
