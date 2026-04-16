/**
 * SelectionOverlay — transparent canvas layered on top of the PDF canvas.
 *
 * Captures a mouse-drag to draw a bounding-box and reports the normalised
 * rectangle back to the parent via `onSelectionEnd`.
 *
 * Visual style
 * ------------
 * - NO backdrop blur or heavy opacity — equations remain fully readable.
 * - Crisp 2 px purple border with very subtle tinted fill (≤ 0.12 alpha).
 * - Corner brackets for a precise, developer/academic look.
 * - Gentle outer glow (low-blur shadow) for polish without obscuring text.
 *
 * Props
 * -----
 * width          : number                    – overlay width  (must match PDF canvas)
 * height         : number                    – overlay height (must match PDF canvas)
 * onSelectionEnd : ({ x1,y1,x2,y2 } | null)  – fires when the user finishes drawing.
 *                  Coordinates are in **canvas pixels** (top-left origin).
 *                  x1 ≤ x2, y1 ≤ y2 always hold.  `null` for rejected clicks.
 *
 * Implementation notes
 * --------------------
 * Drag state is stored in a ref (not React state) so mouse-move does NOT
 * trigger React re-renders — all visual feedback is drawn imperatively on
 * the overlay canvas via requestAnimationFrame.
 */

import { useRef, useCallback, useEffect } from "react";

const MIN_SIZE = 10; // px – reject accidental clicks

/* ── Colour palette ──────────────────────────────────────────── */
const PURPLE        = { r: 168, g: 85,  b: 247 };  // #A855F7
const PURPLE_LIGHT  = { r: 192, g: 132, b: 252 };  // #C084FC
const rgb = (c, a) => `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;

export default function SelectionOverlay({ width, height, onSelectionEnd, highlight, disabled = false }) {
  const overlayRef = useRef(null);
  const dragRef = useRef(null);      // { sx, sy, cx, cy } — start + current
  const rafRef = useRef(null);       // requestAnimationFrame id
  const draggingRef = useRef(false); // true while mouse is held down
  const fadeRef = useRef(null);      // fade-stabilise animation id

  // --- drawing helpers ---------------------------------------------------

  const clear = useCallback(() => {
    const ctx = overlayRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, width, height);
  }, [width, height]);

  /**
   * Draw the selection rectangle.
   * @param {number} pulse  0–1 intensity (0 = settled, >0 = active drag)
   * @param {boolean} settled  true after mouseup — show stronger settled state
   */
  const drawRect = useCallback((pulse = 0, settled = false) => {
    const d = dragRef.current;
    const ctx = overlayRef.current?.getContext("2d");
    if (!d || !ctx) return;

    const x = Math.min(d.sx, d.cx);
    const y = Math.min(d.sy, d.cy);
    const w = Math.abs(d.cx - d.sx);
    const h = Math.abs(d.cy - d.sy);

    ctx.clearRect(0, 0, width, height);

    /* ── Fill — ultra-light tint, equations stay readable ───── */
    const fillAlpha = settled ? 0.12 : 0.06 + pulse * 0.06;  // max 0.12
    ctx.fillStyle = rgb(PURPLE, fillAlpha);
    ctx.fillRect(x, y, w, h);

    /* ── Border — crisp 2 px purple, subtle outer glow ─────── */
    // Glow: low blur, no heavy halo
    const glowAlpha = 0.25 + pulse * 0.15;
    ctx.shadowColor = rgb(PURPLE, glowAlpha);
    ctx.shadowBlur = 4 + pulse * 3;     // 4–7 px (subtle, not glass)
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const borderAlpha = settled ? 0.9 : 0.7 + pulse * 0.2;
    ctx.strokeStyle = rgb(PURPLE, borderAlpha);
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);  // inset 1 px for crisp edges

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    /* ── Corner brackets — sharp, academic/developer feel ───── */
    const bracketLen = Math.min(14, w / 4, h / 4);
    if (bracketLen < 4) return;  // too small for brackets

    const bracketAlpha = settled ? 1.0 : 0.8 + pulse * 0.2;
    ctx.strokeStyle = rgb(PURPLE_LIGHT, bracketAlpha);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "square";  // sharp corners, not rounded
    ctx.beginPath();
    // Top-left
    ctx.moveTo(x, y + bracketLen); ctx.lineTo(x, y); ctx.lineTo(x + bracketLen, y);
    // Top-right
    ctx.moveTo(x + w - bracketLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + bracketLen);
    // Bottom-right
    ctx.moveTo(x + w, y + h - bracketLen); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - bracketLen, y + h);
    // Bottom-left
    ctx.moveTo(x + bracketLen, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - bracketLen);
    ctx.stroke();
    ctx.lineCap = "butt";  // reset

    /* ── Dimension label (settled state only) ──────────────── */
    if (settled && w > 50 && h > 30) {
      const label = `${Math.round(w)} × ${Math.round(h)}`;
      ctx.font = "11px 'JetBrains Mono', 'Fira Code', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Background pill
      const metrics = ctx.measureText(label);
      const pillW = metrics.width + 12;
      const pillH = 18;
      const pillX = x + w / 2 - pillW / 2;
      const pillY = y + h + 6;

      ctx.fillStyle = rgb(PURPLE, 0.85);
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 4);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + w / 2, pillY + 3);
    }
  }, [width, height]);

  /** Continuous drag animation loop — gentle pulse, no heavy blur. */
  const animateDrag = useCallback(() => {
    if (!draggingRef.current) return;
    const pulse = (Math.sin(performance.now() / 500) + 1) / 2;  // slower cycle
    drawRect(pulse);
    rafRef.current = requestAnimationFrame(animateDrag);
  }, [drawRect]);

  /** Fade to settled: briefly animate then hold the final settled state. */
  const fadeToSettled = useCallback(() => {
    const start = performance.now();
    const duration = 180; // ms

    const step = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      drawRect((1 - eased) * 0.3, t >= 1);
      if (t < 1) {
        fadeRef.current = requestAnimationFrame(step);
      }
    };
    fadeRef.current = requestAnimationFrame(step);
  }, [drawRect]);

  // Cancel any pending rAF on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (fadeRef.current) cancelAnimationFrame(fadeRef.current);
  }, []);

  // --- mouse position relative to the overlay canvas ---------------------

  const point = (e) => {
    const r = overlayRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - r.left, width)),
      y: Math.max(0, Math.min(e.clientY - r.top, height)),
    };
  };

  // --- finalise helper (shared by mouseup + mouseleave) ------------------

  const finalise = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;

    // Stop the pulse loop
    draggingRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    dragRef.current = null;

    const x1 = Math.min(d.sx, d.cx);
    const y1 = Math.min(d.sy, d.cy);
    const x2 = Math.max(d.sx, d.cx);
    const y2 = Math.max(d.sy, d.cy);

    if (x2 - x1 < MIN_SIZE || y2 - y1 < MIN_SIZE) {
      clear();
      onSelectionEnd?.(null);
      return;
    }

    // Re-store coords for the fade animation to draw from
    dragRef.current = { sx: x1, sy: y1, cx: x2, cy: y2 };
    fadeToSettled();
    onSelectionEnd?.({ x1, y1, x2, y2 });
  }, [clear, fadeToSettled, onSelectionEnd]);

  // --- event handlers ----------------------------------------------------

  const handleMouseDown = (e) => {
    // Cancel any ongoing fade
    if (fadeRef.current) {
      cancelAnimationFrame(fadeRef.current);
      fadeRef.current = null;
    }
    const p = point(e);
    dragRef.current = { sx: p.x, sy: p.y, cx: p.x, cy: p.y };
    draggingRef.current = true;
    // Start the continuous animation loop
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animateDrag);
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current || !draggingRef.current) return;
    const p = point(e);
    dragRef.current.cx = p.x;
    dragRef.current.cy = p.y;
    // The animateDrag loop handles redrawing — no extra rAF needed
  };

  const handleMouseUp = () => finalise();
  const handleMouseLeave = () => finalise(); // finish drag if cursor exits

  // --- persistent highlight after extraction --------------------------------
  useEffect(() => {
    if (!highlight || draggingRef.current) return;
    // Only draw highlight if no active drag
    const ctx = overlayRef.current?.getContext("2d");
    if (!ctx) return;
    // If dragRef has data, the user is mid-selection — don't overwrite
    if (dragRef.current) return;

    const { x1, y1, x2, y2 } = highlight;
    const w = x2 - x1;
    const h = y2 - y1;

    ctx.clearRect(0, 0, width, height);

    // Subtle green fill
    ctx.fillStyle = "rgba(52, 211, 153, 0.10)";
    ctx.fillRect(x1, y1, w, h);

    // Green border
    ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x1 + 1, y1 + 1, w - 2, h - 2);
    ctx.setLineDash([]);
  }, [highlight, width, height]);

  return (
    <canvas
      ref={overlayRef}
      className="overlay-canvas"
      width={width}
      height={height}
      style={{
        width,
        height,
        cursor: disabled ? "text" : "crosshair",
        pointerEvents: disabled ? "none" : "auto",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
}
