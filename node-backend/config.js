/**
 * Centralised application settings.
 *
 * All tunables are read from environment variables with sensible defaults
 * so the app works out of the box for local development.
 */

const path = require("path");
const fs = require("fs");

const BASE_DIR = __dirname;

const UPLOAD_DIR = path.join(BASE_DIR, "uploads");
const TEMP_DIR = path.join(BASE_DIR, "tmp");

// Ensure directories exist
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

module.exports = {
  PORT: parseInt(process.env.PORT || "8001", 10),
  UPLOAD_DIR,
  TEMP_DIR,
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:3002").split(","),
  UPLOAD_MAX_SIZE_MB: parseInt(process.env.UPLOAD_MAX_SIZE_MB || "50", 10),
  OCR_TIMEOUT_MS: parseInt(process.env.OCR_TIMEOUT_MS || "120000", 10),
};
