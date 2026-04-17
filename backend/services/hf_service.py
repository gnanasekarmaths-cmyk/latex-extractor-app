"""
Hugging Face Inference API service — sends a cropped equation image to
the Nougat-LaTeX-Base model hosted on HF and returns LaTeX.

No local model loading required.  Zero GPU / memory cost on our server.
Requires a free HF token (set HF_TOKEN env var).
"""

import asyncio
import io
import logging
from pathlib import Path

import httpx

logger = logging.getLogger("backend.services.hf")

# Nougat-LaTeX-Base — purpose-built for LaTeX equation OCR
_HF_API_URL = (
    "https://router.huggingface.co/hf-inference/models/Norm/nougat-latex-base"
)

# Timeout for the HF API call (seconds)
_TIMEOUT = 60


async def predict_latex(image_bytes: bytes, hf_token: str | None = None) -> str:
    """
    Send *image_bytes* (PNG) to the Hugging Face Inference API and
    return the predicted LaTeX string.

    A free HF token is required — set the HF_TOKEN env var on the server.

    Raises RuntimeError on API failure.
    """
    if not hf_token:
        raise RuntimeError(
            "HF_TOKEN is not configured. Get a free token at "
            "https://huggingface.co/settings/tokens and set it as "
            "an environment variable on the server."
        )

    headers = {
        "Authorization": f"Bearer {hf_token}",
        "Content-Type": "application/octet-stream",
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        logger.info("Sending image (%d bytes) to HF Inference API …", len(image_bytes))

        resp = await client.post(_HF_API_URL, content=image_bytes, headers=headers)

        # HF returns 503 while the model is loading — retry once after wait
        if resp.status_code == 503:
            body = resp.json()
            wait = body.get("estimated_time", 20)
            logger.warning(
                "Model is loading, HF asked us to wait %.0fs. Retrying …", wait
            )
            await asyncio.sleep(min(wait, 30))  # cap at 30 s
            resp = await client.post(_HF_API_URL, content=image_bytes, headers=headers)

        if resp.status_code != 200:
            detail = resp.text[:300]
            logger.error("HF API error %d: %s", resp.status_code, detail)
            raise RuntimeError(
                f"HF Inference API returned {resp.status_code}: {detail}"
            )

        data = resp.json()
        logger.debug("HF raw response: %s", data)

        # The image-to-text pipeline returns [{generated_text: "..."}]
        if isinstance(data, list) and data:
            latex = data[0].get("generated_text", "")
        elif isinstance(data, dict):
            latex = data.get("generated_text", data.get("text", ""))
        else:
            latex = str(data)

        latex = latex.strip()
        if not latex:
            raise RuntimeError("HF Inference API returned empty LaTeX.")

        logger.info("HF prediction: %s", latex[:120])
        return latex
