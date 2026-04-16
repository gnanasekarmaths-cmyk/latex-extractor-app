"""
Image preprocessing pipeline for pix2tex OCR.

Each step improves recognition accuracy without altering the mathematical
structure of the equation.  The pipeline is conservative — aggressive
morphological transforms or hard binarisation would destroy thin strokes
in subscripts, superscripts, and fraction bars.

Pipeline
--------
1. **Background whitening** — detect the dominant (background) colour and
   map it to pure white so the model sees black-on-white regardless of the
   PDF's colour scheme.
2. **Grayscale** — strip remaining colour so the model focuses on shape.
3. **Adaptive contrast** — tile-based local histogram stretch that handles
   uneven illumination / shading far better than a single global stretch.
4. **Adaptive resize** — scale the image so its longer side falls within
   pix2tex's ideal input range (roughly 400–700 px).  Too small → the
   model can't resolve thin strokes; too large → wasted compute and the
   model's receptive field doesn't cover enough context.
5. **Denoise** — light median filter (3×3) removes salt-and-pepper
   artifacts from JPEG or low-DPI rasterisation without smearing lines.
6. **Padding** — add a thin white border so glyphs at the crop edge aren't
   clipped by the model's convolutions.
"""

import logging
from typing import Tuple

from PIL import Image, ImageFilter, ImageOps, ImageStat

logger = logging.getLogger("backend.utils.preprocess")

# pix2tex works best when the image's long side is in this range.
_TARGET_MIN = 400
_TARGET_MAX = 700

# Padding (px) added around the equation after resizing.
_PAD = 8


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _dominant_colour(img: Image.Image) -> Tuple[int, ...]:
    """Return the approximate background colour by quantising to 4 colours
    and picking the most frequent one (which is almost always the background
    for an equation crop)."""
    small = img.resize((64, 64), Image.BILINEAR)
    quantised = small.quantize(colors=4, method=Image.Quantize.MEDIANCUT)
    palette = quantised.getpalette()        # flat R,G,B,R,G,B,...
    histogram = quantised.histogram()[:4]   # counts for the 4 palette entries
    dominant_idx = histogram.index(max(histogram))
    i = dominant_idx * 3
    return tuple(palette[i : i + 3])


def _whiten_background(img: Image.Image) -> Image.Image:
    """Map the dominant background colour to white.

    If the background is already close to white (luminance > 240) this is
    essentially a no-op.  For coloured / dark backgrounds it normalises the
    image to black-on-white which is what pix2tex was trained on.
    """
    bg = _dominant_colour(img)
    luminance = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]
    if luminance > 240:
        return img

    logger.debug("Background colour %s (L=%.0f) → whitening", bg, luminance)

    channels = img.split()
    result_channels = []
    for ch, bg_val in zip(channels, bg):
        if bg_val <= 5:
            result_channels.append(ch)
            continue
        scale = 255.0 / bg_val
        result_channels.append(ch.point(lambda p, s=scale: min(int(p * s), 255)))
    return Image.merge(img.mode, result_channels)


def _adaptive_contrast(gray: Image.Image, *, tile_size: int = 64) -> Image.Image:
    """Tile-based local histogram equalisation (CLAHE-like, Pillow-only).

    Divides the image into *tile_size* × *tile_size* tiles, equalises each
    independently, then applies a mild global stretch to unify.  This
    handles uneven illumination that a single global autocontrast misses.

    Falls back to global autocontrast for images smaller than one tile.
    """
    w, h = gray.size
    if w <= tile_size or h <= tile_size:
        return ImageOps.autocontrast(gray, cutoff=1.0)

    out = Image.new("L", (w, h))
    for ty in range(0, h, tile_size):
        for tx in range(0, w, tile_size):
            box = (tx, ty, min(tx + tile_size, w), min(ty + tile_size, h))
            tile = gray.crop(box)
            stat = ImageStat.Stat(tile)
            if stat.stddev[0] < 2.0:
                out.paste(tile, box)
                continue
            eq = ImageOps.autocontrast(tile, cutoff=0.5)
            out.paste(eq, box)

    out = ImageOps.autocontrast(out, cutoff=0.5)
    return out


def _adaptive_resize(img: Image.Image) -> Image.Image:
    """Scale the image so its long side is in [_TARGET_MIN, _TARGET_MAX].

    • Tiny crops are upscaled (bicubic) so the model has enough pixels.
    • Large crops are down-scaled (Lanczos) to stay within the model's
      receptive field and save memory.
    • Images already in range are left untouched.
    """
    w, h = img.size
    long_side = max(w, h)

    if long_side < _TARGET_MIN:
        factor = _TARGET_MIN / long_side
    elif long_side > _TARGET_MAX:
        factor = _TARGET_MAX / long_side
    else:
        return img

    new_w = max(1, round(w * factor))
    new_h = max(1, round(h * factor))
    resample = Image.BICUBIC if factor > 1 else Image.LANCZOS
    resized = img.resize((new_w, new_h), resample)
    logger.debug(
        "Adaptive resize %d×%d → %d×%d (factor %.2f)",
        w, h, new_w, new_h, factor,
    )
    return resized


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def preprocess_for_ocr(
    img: Image.Image,
    *,
    denoise: bool = True,
) -> Image.Image:
    """
    Prepare *img* for pix2tex inference.

    Parameters
    ----------
    img : PIL.Image.Image
        Input image (any mode — will be converted internally).
    denoise : bool
        Apply a light 3×3 median filter.  Set to False if the source is
        already clean (e.g. high-DPI vector PDF crop).

    Returns
    -------
    PIL.Image.Image
        Preprocessed image in RGB mode (pix2tex expects 3-channel input).
    """
    w, h = img.size
    logger.debug("Preprocess input: %d×%d  mode=%s", w, h, img.mode)

    # 1. Ensure RGB before whitening (handles RGBA, P, L, etc.)
    rgb = img.convert("RGB")

    # 2. Background whitening
    rgb = _whiten_background(rgb)

    # 3. Grayscale
    gray = rgb.convert("L")

    # 4. Adaptive local contrast
    gray = _adaptive_contrast(gray)

    # 5. Adaptive resize
    gray = _adaptive_resize(gray)

    # 6. Denoise
    if denoise:
        gray = gray.filter(ImageFilter.MedianFilter(size=3))
        logger.debug("Applied 3×3 median denoise.")

    # 7. Pad with white border
    padded = ImageOps.expand(gray, border=_PAD, fill=255)

    # Convert to RGB — pix2tex expects 3-channel input
    result = padded.convert("RGB")
    logger.debug(
        "Preprocess output: %d×%d  mode=%s",
        result.size[0], result.size[1], result.mode,
    )
    return result
