"""
OCR service — thin wrapper around the pix2tex model singleton.

Keeps the route layer free of model-loading details and makes it easy
to swap in a different OCR backend later.
"""

import logging
from pathlib import Path

from models.pix2tex_model import predict

logger = logging.getLogger("backend.services.ocr")


def get_latex(image_path: Path, device: str = "cpu") -> str:
    """
    Run pix2tex on *image_path* and return the exact LaTeX string.

    Raises RuntimeError if the model fails or returns empty output.
    """
    logger.info("Running OCR on %s (device=%s)", image_path.name, device)
    return predict(image_path, device=device)
