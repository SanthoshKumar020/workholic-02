// Copies the version-matched pdf.js worker into /public so it can be served
// as a static module. Runs on postinstall and prebuild so it always matches
// the installed pdfjs-dist version.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

try {
  if (!existsSync(src)) {
    console.warn("[copy-pdf-worker] source worker not found (skipping):", src);
    process.exit(0);
  }
  mkdirSync(destDir, { recursive: true });
  copyFileSync(src, dest);
  console.log("[copy-pdf-worker] copied worker to public/pdf.worker.min.mjs");
} catch (err) {
  console.warn("[copy-pdf-worker] failed (non-fatal):", err);
}
