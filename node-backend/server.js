/**
 * Express server entry point.
 *
 * Registers all route modules and configures middleware.
 * Run with: node server.js   (or npm start)
 */

const express = require("express");
const cors = require("cors");
const config = require("./config");

const uploadRouter = require("./routes/upload");
const extractRouter = require("./routes/extract");
const pageTextRouter = require("./routes/pageText");

const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ── Body parsers ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ──────────────────────────────────────────────────────
app.use((req, _res, next) => {
  const t0 = performance.now();
  console.log(`→ ${req.method} ${req.url}`);

  const originalEnd = _res.end;
  _res.end = function (...args) {
    const elapsed = (performance.now() - t0).toFixed(0);
    console.log(`← ${req.method} ${req.url} → ${_res.statusCode} (${elapsed}ms)`);
    originalEnd.apply(this, args);
  };

  next();
});

// ── Routes ───────────────────────────────────────────────────────────────
app.use("/api", uploadRouter);
app.use("/api", extractRouter);
app.use("/api", pageTextRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Backend running", engine: "Node.js/Express" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Global error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err.message);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    latex: "",
    message: err.message || "Internal server error.",
  });
});

// ── Start ────────────────────────────────────────────────────────────────
app.listen(config.PORT, () => {
  console.log(`\n  LaTeX Extractor API (Node.js/Express)`);
  console.log(`  ─────────────────────────────────────`);
  console.log(`  Server  : http://localhost:${config.PORT}`);
  console.log(`  CORS    : ${config.CORS_ORIGINS.join(", ")}`);
  console.log(`  Uploads : ${config.UPLOAD_DIR}`);
  console.log(`  Max size: ${config.UPLOAD_MAX_SIZE_MB} MB\n`);
});
