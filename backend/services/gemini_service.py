"""
Gemini Flash service — sends a cropped equation image to Google's
Gemini 2.0 Flash model and returns LaTeX.

Free tier: 15 RPM, 1500 requests/day, 1M tokens/day.
Requires a free API key from https://aistudio.google.com/apikey

No extra dependencies — uses httpx (already installed).
"""

import asyncio
import base64
import json
import logging

import httpx

logger = logging.getLogger("backend.services.gemini")

_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-flash-latest:generateContent"
)

_SYSTEM_PROMPT = (
    "You are a LaTeX equation extractor. "
    "Given an image of a mathematical equation, return ONLY the LaTeX code "
    "that reproduces the equation. Do not include any explanation, markdown "
    "fences, or surrounding text. Return raw LaTeX only."
)

_TIMEOUT = 30


async def predict_latex(image_bytes: bytes, api_key: str | None = None) -> str:
    """
    Send *image_bytes* (PNG) to Google Gemini Flash and return the
    predicted LaTeX string.

    Raises RuntimeError on API failure.
    """
    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Get a free key at "
            "https://aistudio.google.com/apikey and set it as an "
            "environment variable on the server."
        )

    b64_image = base64.b64encode(image_bytes).decode("ascii")

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _SYSTEM_PROMPT},
                    {
                        "inline_data": {
                            "mime_type": "image/png",
                            "data": b64_image,
                        }
                    },
                ]
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "maxOutputTokens": 1024,
        },
    }

    async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
        logger.info("Sending image (%d bytes) to Gemini Flash …", len(image_bytes))

        resp = await client.post(
            _GEMINI_URL,
            json=payload,
            headers={
                "Content-Type": "application/json",
                "X-goog-api-key": api_key,
            },
        )

        if resp.status_code != 200:
            detail = resp.text[:300]
            logger.error("Gemini API error %d: %s", resp.status_code, detail)
            raise RuntimeError(
                f"Gemini API returned {resp.status_code}: {detail}"
            )

        data = resp.json()
        logger.debug("Gemini raw response keys: %s", list(data.keys()))

        # Extract text from Gemini response
        try:
            candidates = data["candidates"]
            text = candidates[0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as exc:
            logger.error("Unexpected Gemini response shape: %s", data)
            raise RuntimeError(
                f"Could not parse Gemini response: {exc}"
            ) from exc

        # Strip markdown fences if the model adds them despite instructions
        latex = text.strip()
        if latex.startswith("```"):
            lines = latex.split("\n")
            # Remove first and last ``` lines
            if lines[-1].strip() == "```":
                lines = lines[1:-1]
            else:
                lines = lines[1:]
            latex = "\n".join(lines).strip()

        if not latex:
            raise RuntimeError("Gemini returned empty LaTeX.")

        logger.info("Gemini prediction (%d chars): %s", len(latex), latex[:120])
        return latex
