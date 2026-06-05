// Copies the version-matched pdf.js worker into /public so the browser loads
// a worker that exactly matches the installed pdfjs-dist version.
// Runs on postinstall; safe to run manually: `node scripts/copy-pdf-worker.mjs`.
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const dest = join(root, "public", "pdf.worker.min.mjs");

try {
  await mkdir(join(root, "public"), { recursive: true });
  await copyFile(src, dest);
  console.log("[copy-pdf-worker] copied worker -> public/pdf.worker.min.mjs");
} catch (err) {
  console.warn("[copy-pdf-worker] skipped:", err.message);
}
