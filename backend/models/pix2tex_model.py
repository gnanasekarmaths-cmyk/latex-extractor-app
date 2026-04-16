"""
Singleton model loader for pix2tex (LaTeX-OCR).

The model is loaded lazily on first call and reused for all subsequent
requests — avoids the ~5-second cold-start on every extraction.

Thread-safe: uses double-checked locking so concurrent requests never
trigger duplicate loads.

Set MODEL_DEVICE=cuda to run on GPU (requires a CUDA-enabled PyTorch).
"""

import logging
import threading
import time
from pathlib import Path

from PIL import Image

from utils.preprocess import preprocess_for_ocr

logger = logging.getLogger("backend.models.pix2tex")

_lock = threading.Lock()
_model = None


def _load_model(device: str = "cpu"):
    """Import and instantiate the pix2tex LatexOCR model exactly once."""
    global _model

    # Fast path — model already loaded (no lock needed)
    if _model is not None:
        return

    with _lock:
        # Double-checked locking — another thread may have loaded while we waited
        if _model is not None:
            return

        logger.info("Loading pix2tex model on device=%s …", device)
        t0 = time.perf_counter()

        try:
            from pix2tex.cli import LatexOCR
            _model = LatexOCR()
        except ImportError as exc:
            raise RuntimeError(
                "pix2tex is not installed. Run: pip install pix2tex"
            ) from exc
        except Exception as exc:
            raise RuntimeError(
                f"Failed to initialise pix2tex model: {exc}"
            ) from exc

        elapsed = time.perf_counter() - t0
        logger.info("pix2tex model ready (loaded in %.2fs).", elapsed)


def predict_latex(image_path: Path, device: str = "cpu") -> str:
    """
    Run pix2tex inference on *image_path* and return the raw LaTeX string.

    - Model is loaded once on the first call, then reused.
    - No post-processing, correction, or simplification is applied —
      the string is returned exactly as pix2tex produces it.

    Raises
    ------
    FileNotFoundError  – image_path does not exist
    RuntimeError       – model load failure or empty OCR output
    """
    if not image_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    _load_model(device)

    logger.info("Running inference on %s …", image_path.name)
    t0 = time.perf_counter()

    try:
        img = Image.open(image_path).convert("RGB")
        # Preprocess: grayscale → contrast → 2× upscale → denoise → back to RGB
        img = preprocess_for_ocr(img)
        latex: str = _model(img)
    except Exception as exc:
        raise RuntimeError(f"pix2tex inference failed: {exc}") from exc

    elapsed = time.perf_counter() - t0
    logger.info("Inference done in %.2fs — output length %d chars.", elapsed, len(latex or ""))

    if not latex or not latex.strip():
        raise RuntimeError("pix2tex returned empty output for the given image.")

    return latex.strip()


# Backward-compatible alias used by ocr_service
predict = predict_latex
