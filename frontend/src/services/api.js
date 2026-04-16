/**
 * API service — centralised HTTP layer for the backend.
 *
 * Every backend call lives here so components never import axios directly.
 * Base URL is configurable via the REACT_APP_API_BASE_URL env var.
 *
 * Exports
 * -------
 * uploadPDF(file)          – upload a PDF, get back a file_id
 * extractEquation(data)    – send crop coordinates, get back LaTeX
 * ApiError                 – normalised error class thrown by both helpers
 */

import axios from "axios";

// ── Config ──────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8001/api";

// Axios instance (used by extractEquation and any legacy callers)
const API = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min — model inference can be slow on first call
});

// ── Normalised error ────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {string}  message  Human-readable description.
   * @param {number}  status   HTTP status code (0 = network / timeout).
   * @param {*}       detail   Raw response body or original error.
   */
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Turn any axios error into a predictable `ApiError`.
 * Callers only need to catch one type regardless of failure mode.
 */
function normaliseError(err) {
  if (err instanceof ApiError) return err;

  if (axios.isCancel(err)) {
    return new ApiError("Request was cancelled.", 0, err);
  }

  if (err.response) {
    // Server replied with an error status
    const { status, data } = err.response;
    console.error(`[api] Server responded with status ${status}`, data);
    const msg =
      data?.detail || data?.message || `Server error (${status}).`;
    return new ApiError(msg, status, data);
  }

  if (err.request) {
    // Request was made but no response received (network / timeout)
    const isTimeout = err.code === "ECONNABORTED";
    console.error("[api] No response received —", isTimeout ? "request timed out" : "network error", err.message);
    const msg = isTimeout
      ? "Request timed out — the server may be busy. Try again."
      : "Cannot reach the server — is the backend running on port 8001?";
    return new ApiError(msg, 0, err);
  }

  // Something else went wrong while setting up the request
  console.error("[api] Request setup error:", err.message);
  return new ApiError(err.message || "Unexpected error.", 0, err);
}

// ── Public helpers ──────────────────────────────────────────────────────

/**
 * Upload a PDF file and receive a persistent file_id.
 *
 * @param {File} file  The user-selected PDF blob.
 * @returns {Promise<{ file_id: string, stored_filename: string, original_filename: string }>}
 * @throws {ApiError} On network failure or server rejection.
 */
export async function uploadPDF(file) {
  const form = new FormData();
  form.append("file", file);

  const url = `${BASE_URL}/upload`;
  const t0 = performance.now();
  console.log("[api] uploadPDF → POST", url, { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, type: file.type });

  try {
    // Use fetch — do NOT set Content-Type; the browser sets the correct
    // multipart boundary automatically when the body is FormData.
    const res = await fetch(url, {
      method: "POST",
      body: form,
      // No headers — let browser handle multipart Content-Type
    });

    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[api] uploadPDF ← status ${res.status} (${elapsed} ms)`);

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("[api] uploadPDF server error:", errBody);
      throw new ApiError(
        errBody.detail || errBody.message || `Server error (${res.status}).`,
        res.status,
        errBody,
      );
    }

    const data = await res.json();
    console.log("[api] uploadPDF ← response data:", data);

    // Handle { success: false } from Node.js backend
    if (data.success === false) {
      throw new ApiError(data.message || "Upload failed.", res.status, data);
    }

    return data;
  } catch (err) {
    const elapsed = (performance.now() - t0).toFixed(0);
    if (err instanceof ApiError) throw err;
    // Network / CORS / timeout error
    console.error(`[api] uploadPDF ✗ network error after ${elapsed} ms:`, err.message);
    throw new ApiError(
      "Cannot reach the server — is the backend running on port 8001?",
      0,
      err,
    );
  }
}

/**
 * Send crop coordinates for a previously uploaded PDF and get LaTeX back.
 *
 * All coordinate values must be in **PDF user-space points** (1/72 in),
 * NOT canvas pixels.  Use `canvasToPdfCoords()` before calling this.
 *
 * @param {{
 *   filename: string,
 *   page_number: number,
 *   x: number, y: number,
 *   width: number, height: number,
 *   page_width: number, page_height: number,
 * }} data
 * @returns {Promise<{ latex: string, status: string }>}
 * @throws {ApiError} On network failure or server rejection.
 */
export async function extractEquation(data) {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    form.append(key, String(value));
  }

  const t0 = performance.now();
  console.log("[api] extractEquation → POST /extract-equation", data);

  try {
    const res = await API.post("/extract-equation", form);
    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[api] extractEquation ← ${res.status} OK (${elapsed} ms)`, res.data);

    // Handle { success: false } from Node.js backend
    if (res.data.success === false) {
      throw new ApiError(res.data.message || "Extraction failed.", res.status, res.data);
    }

    return res.data;
  } catch (err) {
    const elapsed = (performance.now() - t0).toFixed(0);
    console.error(`[api] extractEquation ✗ failed after ${elapsed} ms`, err.response?.status ?? "no response", err.message);
    throw normaliseError(err);
  }
}

// Backward-compatible aliases so nothing breaks during migration
export const uploadPdf = uploadPDF;
export const extractLatex = extractEquation;

// ── Premium feature: extract full page text ────────────────────────────

/**
 * Extract all embedded text from a single PDF page.
 *
 * Uses PyMuPDF's built-in text extraction (no OCR). The returned text
 * preserves paragraph breaks. The client applies `normalizeSymbols()`
 * to convert Unicode math glyphs to LaTeX commands.
 *
 * [PREMIUM] This endpoint powers the "Convert Entire Page" feature.
 * To gate behind a paywall:
 *   - Check `user.isPremium` before calling
 *   - The backend can verify the subscription via auth middleware
 *
 * @param {{ filename: string, page_number: number }} data
 * @returns {Promise<{ text: string, page_number: number, char_count: number, status: string }>}
 * @throws {ApiError}
 */
export async function extractPageText({ filename, page_number }) {
  const form = new FormData();
  form.append("filename", filename);
  form.append("page_number", String(page_number));

  const t0 = performance.now();
  console.log("[api] extractPageText → POST /extract-page-text", { filename, page_number });

  try {
    const res = await API.post("/extract-page-text", form);
    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`[api] extractPageText ← ${res.status} OK (${elapsed} ms)`, res.data);
    return res.data;
  } catch (err) {
    const elapsed = (performance.now() - t0).toFixed(0);
    console.error(`[api] extractPageText ✗ failed after ${elapsed} ms`, err.response?.status ?? "no response", err.message);
    throw normaliseError(err);
  }
}

// ── Future: AI-powered full-page conversion ─────────────────────────────
//
// [PREMIUM / AI] Placeholder for vision-model-based page conversion.
// When implemented, this will send a high-res page image to an AI model
// (GPT-4V, Nougat, or custom fine-tuned model) for perfect LaTeX output.
//
// export async function convertPageAI({ filename, page_number }) {
//   const form = new FormData();
//   form.append("filename", filename);
//   form.append("page_number", String(page_number));
//   const res = await API.post("/convert-page-ai", form);
//   return res.data;
// }

export default API;
