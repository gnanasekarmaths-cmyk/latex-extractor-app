/**
 * PDFViewer — renders ALL pages of a PDF stacked vertically using react-pdf.
 *
 * Uses the `width` prop on each <Page> for scaling (NOT CSS transform).
 * This ensures the canvas pixel size matches the displayed size,
 * preventing selection/highlight misalignment.
 *
 * Props
 * -----
 * file             : File                   – the user-selected PDF blob
 * pageWidth        : number                 – rendered page width in px (controls zoom)
 * onDocumentLoad   : (numPages) => void     – fires once after document is parsed
 * onPageRender     : (pageNum, dims) => void – fires after each page renders
 *                     dims = { canvasWidth, canvasHeight, pdfWidth, pdfHeight }
 * renderPageOverlay: (pageNum, dims) => ReactNode
 *                     – inject an overlay (e.g. SelectionOverlay) on each page
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url,
).toString();

/* ── Single-page wrapper (internal, memoised) ───────────────── */

const PDFPageWrapper = React.memo(function PDFPageWrapper({ pageNumber, pageWidth, onRender, renderOverlay }) {
  const [dims, setDims] = useState(null);
  const [visible, setVisible] = useState(pageNumber === 1); // first page eager
  const sentinelRef = useRef(null);

  // Lazy-load: render page only when it scrolls into view
  useEffect(() => {
    if (visible) return; // already visible, no observer needed
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  const onRenderSuccess = useCallback(
    (page) => {
      const d = {
        canvasWidth: page.width,
        canvasHeight: page.height,
        pdfWidth: page.originalWidth,
        pdfHeight: page.originalHeight,
      };
      setDims(d);
      onRender?.(pageNumber, d);
    },
    [pageNumber, onRender],
  );

  return (
    <div className="pdf-page-container" ref={sentinelRef}>
      <span className="page-label">Page {pageNumber}</span>
      <div className="canvas-wrapper" style={{ position: "relative" }}>
        {visible ? (
          <Page
            pageNumber={pageNumber}
            width={pageWidth}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            onRenderSuccess={onRenderSuccess}
            loading={
              <div className="pdf-loading">
                <span className="spinner" />
                Rendering page…
              </div>
            }
          />
        ) : (
          <div className="pdf-loading" style={{ height: pageWidth * 1.414 }}>
            <span className="spinner" />
            Waiting to render…
          </div>
        )}
        {dims && renderOverlay?.(pageNumber, dims)}
      </div>
    </div>
  );
});

/* ── Document-level component (public) ────────────────────────── */

export default function PDFViewer({
  file,
  pageWidth = 800,
  onDocumentLoad,
  onPageRender,
  renderPageOverlay,
}) {
  const [numPages, setNumPages] = useState(0);
  const [fileUrl, setFileUrl] = useState(null);

  // Convert File blob to an object URL for react-pdf
  useEffect(() => {
    if (!file) { setFileUrl(null); return; }
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDocumentLoadSuccess = useCallback(
    (pdf) => {
      setNumPages(pdf.numPages);
      onDocumentLoad?.(pdf.numPages);
    },
    [onDocumentLoad],
  );

  if (!fileUrl) return null;

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="pdf-loading">
          <span className="spinner" />
          Loading document…
        </div>
      }
      error={<div className="pdf-error">Failed to load PDF document.</div>}
    >
      <div className="pdf-pages">
        {Array.from({ length: numPages }, (_, i) => (
          <PDFPageWrapper
            key={i + 1}
            pageNumber={i + 1}
            pageWidth={pageWidth}
            onRender={onPageRender}
            renderOverlay={renderPageOverlay}
          />
        ))}
      </div>
    </Document>
  );
}
