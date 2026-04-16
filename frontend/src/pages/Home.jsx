/**
 * Home — orchestrates the equation-extraction workflow.
 *
 * Layout (2-column, 70/30)
 * ----------------------------------
 *  Desktop (≥768 px):  70% PDF Viewer | 30% LaTeX Output
 *  Mobile  (<768):     single column stack
 *
 * Zoom is controlled via `width` prop on react-pdf's <Page>
 * (no CSS transform: scale) to prevent overlay misalignment.
 */

import { useCallback, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

import PDFViewer from "../components/PDFViewer";
import SelectionOverlay from "../components/SelectionOverlay";
import LatexViewer from "../components/LatexViewer";
import MobileDrawer from "../components/MobileDrawer";
import UploadZone from "../components/UploadZone";
import ResizableSplit from "../components/ResizableSplit";
import { uploadPDF, extractEquation, extractPageText, ApiError } from "../services/api";
import { canvasToPdfCoords } from "../utils/coordinateMapper";
import { normalizeSymbols } from "../utils/normalizeSymbols";
import { useToast } from "../components/Toast";

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.25;
const ZOOM_DEFAULT = 1.0;

const LATEX_ZOOM_MIN = 0.5;
const LATEX_ZOOM_MAX = 2.5;
const LATEX_ZOOM_STEP = 0.25;
const LATEX_ZOOM_DEFAULT = 1.0;

export default function Home({
  file,
  setFile,
  fileId,
  setFileId,
  uploading,
  setUploading,
}) {
  const toast = useToast();

  /* ── State ───────────────────────────────────────────────────── */
  const [numPages, setNumPages] = useState(0);
  const [selection, setSelection] = useState(null);
  const [latex, setLatex] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState("Upload a PDF to get started");
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [containerWidth, setContainerWidth] = useState(700);
  const [latexZoom, setLatexZoom] = useState(LATEX_ZOOM_DEFAULT);
  const [extractedHighlight, setExtractedHighlight] = useState(null); // { page, x1, y1, x2, y2 }
  const [selectionMode, setSelectionMode] = useState("draw"); // "draw" | "text"
  const [currentPage, setCurrentPage] = useState(1);           // page navigation
  const [convertingPage, setConvertingPage] = useState(false);  // "Convert Entire Page" loading

  /* ── Premium feature gating ─────────────────────────────────────
   * Set `isPremium` to true to unlock premium-only features:
   *   • "Convert Entire Page" button (full-page text → LaTeX)
   *   • Future: AI-powered page conversion
   *
   * In production, derive this from your auth context / subscription:
   *   const { user } = useAuth();
   *   const isPremium = user?.plan === "premium";
   * ──────────────────────────────────────────────────────────────── */
  const isPremium = true; // TODO: wire to real auth / subscription check

  const pageDimsRef = useRef({});
  const pdfPaneRef = useRef(null);

  /* ── Measure PDF container width ──────────────────────────────
   * We read clientWidth from the pane ref. This gives us the inner
   * width INCLUDING the scrollbar gutter, minus padding (since we
   * measure after layout). We use ResizeObserver but only update
   * state if the change is significant (>5px) to prevent feedback.
   * overflow-y:scroll in CSS ensures the scrollbar is always present
   * so content changes never toggle scrollbar visibility.
   * ──────────────────────────────────────────────────────────────── */
  const widthRef = useRef(700);
  useEffect(() => {
    const el = pdfPaneRef.current;
    if (!el) return;
    // Initial measurement
    const measure = () => {
      const w = el.clientWidth - 48; // subtract .pdf-pane padding (24px * 2)
      if (w > 0 && Math.abs(w - widthRef.current) > 5) {
        widthRef.current = w;
        setContainerWidth(w);
      }
    };
    measure();
    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Page width: fill container at zoom 1.0, scale with zoom
  const pageWidth = Math.round(containerWidth * zoom);

  /* ── Text-selection handler (for "text" mode) ────────────────
   * Listens for mouseup on the PDF pane. When the user releases
   * the mouse after selecting text from the text layer, we read
   * the browser selection, normalise symbols → LaTeX, and push
   * the result straight into the LaTeX panel.
   * ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (selectionMode !== "text") return;
    const el = pdfPaneRef.current;
    if (!el) return;

    const onMouseUp = () => {
      const sel = window.getSelection();
      const raw = sel?.toString().trim();
      if (!raw) return;
      const normalized = normalizeSymbols(raw);
      if (normalized) {
        setLatex(normalized);
        setStatus("Text selected — LaTeX updated");
        setDrawerOpen(true);
      }
    };

    el.addEventListener("mouseup", onMouseUp);
    return () => el.removeEventListener("mouseup", onMouseUp);
  }, [selectionMode]);

  /* ── Clear selection on zoom change ──────────────────────────── */
  const prevZoomRef = useRef(zoom);
  useEffect(() => {
    if (prevZoomRef.current !== zoom) {
      setSelection(null);
      pageDimsRef.current = {};
      prevZoomRef.current = zoom;
    }
  }, [zoom]);

  /* ── Upload — react to file changes via useEffect ────────────── */
  useEffect(() => {
    if (!file) return;

    console.log("[Home] File changed, starting upload:", file.name);

    setFileId(null);
    setNumPages(0);
    setSelection(null);
    setLatex("");
    setError("");
    setExtractedHighlight(null);
    setStatus("Uploading…");
    setUploading(true);
    pageDimsRef.current = {};

    let cancelled = false;

    uploadPDF(file)
      .then(({ file_id }) => {
        if (cancelled) return;
        console.log("[Home] Upload success, file_id:", file_id);
        setFileId(file_id);
        setStatus("Draw a selection around the equation");
        toast.success("PDF uploaded successfully");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[Home] Upload error:", err);
        let msg;
        if (err instanceof ApiError) {
          if (err.status === 0)
            msg = "Cannot reach the server — make sure the backend is running.";
          else if (err.status === 413)
            msg = "File is too large — maximum size is 20 MB.";
          else if (err.status === 415)
            msg = "Unsupported file type — please upload a PDF.";
          else
            msg = err.message;
        } else {
          msg = "Upload failed — an unexpected error occurred.";
        }
        setError(msg);
        setStatus("Upload failed");
        setFile(null);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setUploading(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  /* ── Callbacks ───────────────────────────────────────────────── */

  const handleDocumentLoad = useCallback((n) => {
    setNumPages(n);
    setSelection(null);
    setLatex("");
    pageDimsRef.current = {};
  }, []);

  const handlePageRender = useCallback((pageNum, dims) => {
    pageDimsRef.current[pageNum] = dims;
  }, []);

  const handleSelectionEnd = useCallback((pageNum, rect) => {
    if (rect) {
      setSelection({ ...rect, page: pageNum });
      setLatex("");
      setExtractedHighlight(null);
      setStatus(`Selection on page ${pageNum} — click Extract`);
    } else {
      setSelection(null);
      setStatus("Selection too small — try again");
    }
  }, []);

  const renderPageOverlay = useCallback(
    (pageNum, dims) => (
      <SelectionOverlay
        width={dims.canvasWidth}
        height={dims.canvasHeight}
        onSelectionEnd={(rect) => handleSelectionEnd(pageNum, rect)}
        highlight={
          extractedHighlight && extractedHighlight.page === pageNum
            ? extractedHighlight
            : null
        }
        disabled={selectionMode === "text"}
      />
    ),
    [handleSelectionEnd, extractedHighlight, selectionMode],
  );

  const handleExtract = async () => {
    if (!selection || !fileId) {
      setError("Select a region first.");
      return;
    }

    const dims = pageDimsRef.current[selection.page];
    if (!dims) {
      setError("Page dimensions not available. Try selecting again.");
      return;
    }

    const pdfBox = canvasToPdfCoords(
      { width: dims.canvasWidth, height: dims.canvasHeight },
      { width: dims.pdfWidth, height: dims.pdfHeight },
      selection,
    );

    setError("");
    setStatus("Extracting…");
    setExtracting(true);

    try {
      console.log("[Home] Extracting equation:", { fileId, page: selection.page, ...pdfBox });
      const { latex: result } = await extractEquation({
        filename: fileId,
        page_number: selection.page,
        ...pdfBox,
      });
      setLatex(result);
      setStatus("Extraction complete");
      setDrawerOpen(true);
      setExtractedHighlight({ page: selection.page, x1: selection.x1, y1: selection.y1, x2: selection.x2, y2: selection.y2 });
      toast.success("LaTeX extracted successfully");
    } catch (err) {
      console.error("[Home] Extract error:", err);
      let msg;
      if (err instanceof ApiError) {
        if (err.status === 0)
          msg = "Cannot reach the server — make sure the backend is running.";
        else if (err.status === 404)
          msg = "File not found on server — try re-uploading.";
        else if (err.status === 422)
          msg = "Invalid selection — try drawing a larger region.";
        else if (err.status === 504)
          msg = "OCR timed out — try selecting a smaller region.";
        else
          msg = err.message;
      } else {
        msg = "Extraction failed — an unexpected error occurred.";
      }
      setError(msg);
      setStatus("Extraction failed");
      toast.error(msg);
    } finally {
      setExtracting(false);
    }
  };

  const canExtract = !!selection && !!fileId && !extracting;

  /* ── [PREMIUM] Convert Entire Page handler ───────────────────
   * Extracts all embedded text from the current page via PyMuPDF,
   * runs normalizeSymbols to convert Unicode math → LaTeX, and
   * pushes the result into the LaTeX panel.
   *
   * Premium gating: only available when `isPremium === true`.
   * Future: swap the text-extraction call with `convertPageAI()`
   * for AI-powered perfect LaTeX conversion of complex layouts.
   * ──────────────────────────────────────────────────────────── */
  const handleConvertPage = async () => {
    if (!fileId || !isPremium) return;
    setError("");
    setStatus(`Converting page ${currentPage}…`);
    setConvertingPage(true);

    try {
      const { text } = await extractPageText({
        filename: fileId,
        page_number: currentPage,
      });

      if (!text || !text.trim()) {
        setError("No selectable text found on this page. Try using Draw mode with OCR instead.");
        setStatus("No text found");
        toast.error("Page has no embedded text — use OCR");
        return;
      }

      // Normalize all math symbols → LaTeX commands
      const normalized = normalizeSymbols(text);
      setLatex(normalized);
      setStatus(`Page ${currentPage} converted — ${text.length} characters`);
      setDrawerOpen(true);
      toast.success(`Page ${currentPage} converted to LaTeX`);
    } catch (err) {
      console.error("[Home] Convert page error:", err);
      const msg = err instanceof ApiError
        ? err.message
        : "Page conversion failed — an unexpected error occurred.";
      setError(msg);
      setStatus("Conversion failed");
      toast.error(msg);
    } finally {
      setConvertingPage(false);
    }
  };

  /* ── Page navigation ─────────────────────────────────────────── */
  const handlePagePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handlePageNext = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const scrollToPage = (pageNum) => {
    const el = pdfPaneRef.current?.querySelector(
      `.pdf-page-container:nth-child(${pageNum})`,
    );
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Scroll to page when currentPage changes
  useEffect(() => {
    if (numPages > 0 && currentPage >= 1) scrollToPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /* ── Zoom handlers ───────────────────────────────────────────── */
  const handleZoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const handleZoomReset = () => setZoom(ZOOM_DEFAULT);

  const handleLatexZoomIn = () => setLatexZoom((z) => Math.min(LATEX_ZOOM_MAX, +(z + LATEX_ZOOM_STEP).toFixed(2)));
  const handleLatexZoomOut = () => setLatexZoom((z) => Math.max(LATEX_ZOOM_MIN, +(z - LATEX_ZOOM_STEP).toFixed(2)));
  const handleLatexZoomReset = () => setLatexZoom(LATEX_ZOOM_DEFAULT);

  /* ── Portal: Extract button in header ────────────────────── */
  const headerSlot = typeof document !== 'undefined'
    ? document.getElementById('header-extract-slot')
    : null;

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <div className="home-root">
      {/* Portal: Extract button → header */}
      {headerSlot && createPortal(
        <motion.button
          className="extract-btn"
          onClick={handleExtract}
          disabled={!canExtract}
          whileHover={canExtract ? { scale: 1.03 } : {}}
          whileTap={canExtract ? { scale: 0.97 } : {}}
        >
          {extracting ? (
            <><span className="spinner" style={{ borderTopColor: "#fff" }} /> Extracting…</>
          ) : (
            "Extract LaTeX"
          )}
        </motion.button>,
        headerSlot,
      )}

      {/* ── Status bar ─────────────────────────────────────────── */}
      <div className="toolbar-strip">
        <div className="toolbar-inner">
          {/* Page navigation */}
          <AnimatePresence>
            {numPages > 1 && (
              <motion.div
                className="page-nav"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <button
                  className="page-nav__btn"
                  onClick={handlePagePrev}
                  disabled={currentPage <= 1}
                  aria-label="Previous page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="page-nav__label">
                  {currentPage} / {numPages}
                </span>
                <button
                  className="page-nav__btn"
                  onClick={handlePageNext}
                  disabled={currentPage >= numPages}
                  aria-label="Next page"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {numPages > 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="page-badge"
              >
                {numPages} {numPages === 1 ? "page" : "pages"}
              </motion.span>
            )}
          </AnimatePresence>

          <div className="status-bar flex-1 min-w-0">
            <span className="status-icon" />
            <span className="truncate">{status}</span>
          </div>

          {/* [PREMIUM] Convert Entire Page button */}
          <AnimatePresence>
            {isPremium && fileId && numPages > 0 && (
              <motion.button
                className="convert-page-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleConvertPage}
                disabled={convertingPage || extracting}
                whileHover={!convertingPage ? { scale: 1.03 } : {}}
                whileTap={!convertingPage ? { scale: 0.97 } : {}}
                title={`Convert all text on page ${currentPage} to LaTeX`}
              >
                {convertingPage ? (
                  <><span className="spinner" style={{ borderTopColor: "#fff", width: 12, height: 12 }} /> Converting…</>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Convert Page {currentPage}
                    <span className="premium-badge">PRO</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {selection && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="selection-summary hidden md:inline-flex"
              >
                p{selection.page}: ({Math.round(selection.x1)}, {Math.round(selection.y1)}) →
                ({Math.round(selection.x2)}, {Math.round(selection.y2)})
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="error-banner"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="truncate">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Resizable Split (PDF | LaTeX) ─────────────────────── */}
      <ResizableSplit
        defaultLeft={70}
        minLeft={30}
        maxLeft={85}
        className="app-grid-2col"
        left={
          <motion.section
            className="grid-panel grid-panel--pdf"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {/* Sticky zoom controls + mode toggle */}
            {file && (
              <div className="zoom-controls">
                {/* Draw / Text mode toggle */}
                <div className="mode-toggle">
                  <button
                    className={`mode-toggle__btn ${selectionMode === "draw" ? "mode-toggle__btn--active" : ""}`}
                    onClick={() => setSelectionMode("draw")}
                    title="Draw selection box around equation (OCR)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    Draw
                  </button>
                  <button
                    className={`mode-toggle__btn ${selectionMode === "text" ? "mode-toggle__btn--active" : ""}`}
                    onClick={() => setSelectionMode("text")}
                    title="Select text directly (normalizes symbols to LaTeX)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="4 7 4 4 20 4 20 7" />
                      <line x1="9" y1="20" x2="15" y2="20" />
                      <line x1="12" y1="4" x2="12" y2="20" />
                    </svg>
                    Text
                  </button>
                </div>

                <div className="zoom-controls__separator" />
                <button
                  className="zoom-btn"
                  onClick={handleZoomOut}
                  disabled={zoom <= ZOOM_MIN}
                  aria-label="Zoom out"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>

                <button
                  className="zoom-level"
                  onClick={handleZoomReset}
                  title="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>

                <button
                  className="zoom-btn"
                  onClick={handleZoomIn}
                  disabled={zoom >= ZOOM_MAX}
                  aria-label="Zoom in"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>
            )}

            <div
              ref={pdfPaneRef}
              className={`pdf-pane pdf-pane--white ${selectionMode === "text" ? "pdf-pane--text-mode" : ""}`}
              onScroll={(e) => {
                e.currentTarget.classList.toggle('is-scrolled', e.currentTarget.scrollTop > 8);
              }}
            >
              {file ? (
                <div className="pdf-scroll-area">
                  <PDFViewer
                    file={file}
                    pageWidth={pageWidth}
                    onDocumentLoad={handleDocumentLoad}
                    onPageRender={handlePageRender}
                    renderPageOverlay={renderPageOverlay}
                  />
                </div>
              ) : (
                <div className="pdf-upload-empty">
                  <UploadZone
                    onFile={setFile}
                    uploading={uploading}
                    uploadDone={!!fileId}
                  />
                </div>
              )}
            </div>
          </motion.section>
        }
        right={
          <motion.aside
            className="grid-panel grid-panel--latex glass-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          >
            <div className="latex-panel-header">
              <h2 className="panel-title" style={{ margin: 0 }}>LaTeX Output</h2>
              <div className="latex-zoom-controls">
                <button
                  className="zoom-btn"
                  onClick={handleLatexZoomOut}
                  disabled={latexZoom <= LATEX_ZOOM_MIN}
                  aria-label="LaTeX zoom out"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
                <button
                  className="zoom-level"
                  onClick={handleLatexZoomReset}
                  title="Reset LaTeX zoom"
                  style={{ minWidth: 44, fontSize: '0.72rem' }}
                >
                  {Math.round(latexZoom * 100)}%
                </button>
                <button
                  className="zoom-btn"
                  onClick={handleLatexZoomIn}
                  disabled={latexZoom >= LATEX_ZOOM_MAX}
                  aria-label="LaTeX zoom in"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="latex-pane-inner">
              {latex ? (
                <LatexViewer latex={latex} extracting={extracting} zoom={latexZoom} />
              ) : extracting ? (
                <LatexViewer latex="" extracting={true} zoom={latexZoom} />
              ) : (
                <div className="empty-state" style={{ minHeight: 200 }}>
                  <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  <h3>LaTeX Output</h3>
                  <p>Select an equation region and click Extract to see the result here</p>
                </div>
              )}
            </div>
          </motion.aside>
        }
      />

      {/* ── Mobile: FAB + drawer for LaTeX results ─────────────── */}
      <div className="md:hidden">
        <AnimatePresence>
          {latex && !drawerOpen && (
            <motion.button
              className="fab"
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: [0, 1.15, 0.95, 1], opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={() => setDrawerOpen(true)}
              aria-label="Show LaTeX result"
            >
              <span className="fab-icon">&lt;/&gt;</span>
              <span className="fab-glow" />
            </motion.button>
          )}
        </AnimatePresence>

        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <LatexViewer latex={latex} extracting={extracting} />
        </MobileDrawer>
      </div>
    </div>
  );
}
