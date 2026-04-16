/**
 * ResizableSplit — horizontal split layout with a draggable divider.
 *
 * Desktop (≥768px): side-by-side with drag-to-resize divider.
 * Mobile  (<768px): vertically stacked, divider hidden.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export default function ResizableSplit({ left, right, defaultLeft = 70, minLeft = 30, maxLeft = 85, className = "" }) {
  const [leftPct, setLeftPct] = useState(defaultLeft);
  const [dragging, setDragging] = useState(false);
  const splitRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const rect = splitRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(maxLeft, Math.max(minLeft, pct)));
  }, [minLeft, maxLeft]);

  const stopDrag = useCallback(() => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopDrag);
    document.body.classList.remove("is-resizing");
    setDragging(false);
  }, [handleMouseMove]);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopDrag);
    document.body.classList.add("is-resizing");
    setDragging(true);
  }, [handleMouseMove, stopDrag]);

  /* Touch support */
  const handleTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = splitRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((touch.clientX - rect.left) / rect.width) * 100;
    setLeftPct(Math.min(maxLeft, Math.max(minLeft, pct)));
  }, [minLeft, maxLeft]);

  const stopTouchDrag = useCallback(() => {
    document.removeEventListener("touchmove", handleTouchMove);
    document.removeEventListener("touchend", stopTouchDrag);
    document.body.classList.remove("is-resizing");
    setDragging(false);
  }, [handleTouchMove]);

  const startTouchDrag = useCallback((e) => {
    e.preventDefault();
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", stopTouchDrag);
    document.body.classList.add("is-resizing");
    setDragging(true);
  }, [handleTouchMove, stopTouchDrag]);

  /* Keyboard support for accessibility */
  const handleKeyDown = useCallback((e) => {
    const step = 2;
    if (e.key === "ArrowLeft") setLeftPct((v) => Math.max(minLeft, v - step));
    else if (e.key === "ArrowRight") setLeftPct((v) => Math.min(maxLeft, v + step));
  }, [minLeft, maxLeft]);

  /* Cleanup on unmount */
  useEffect(() => () => document.body.classList.remove("is-resizing"), []);

  return (
    <div
      ref={splitRef}
      className={`resizable-split ${dragging ? "resizable-split--dragging" : ""} ${className}`}
    >
      <div className="resizable-split__left" style={{ width: `${leftPct}%` }}>
        {left}
      </div>

      <div
        className="resizable-split__divider"
        onMouseDown={startDrag}
        onTouchStart={startTouchDrag}
        onKeyDown={handleKeyDown}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(leftPct)}
        aria-valuemin={minLeft}
        aria-valuemax={maxLeft}
        tabIndex={0}
      />

      <div className="resizable-split__right">
        {right}
      </div>
    </div>
  );
}
