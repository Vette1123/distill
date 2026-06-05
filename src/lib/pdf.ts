import type { ExtractedLine } from "./types";

// Lazily load pdf.js (browser only) and point it at the version-matched worker
// we copied into /public during install.
let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export interface LoadedPdf {
  numPages: number;
  getPageLines: (pageNum: number) => Promise<ExtractedLine[]>;
  renderPage: (pageNum: number, scale: number) => Promise<HTMLCanvasElement>;
  pageSize: (pageNum: number, scale: number) => Promise<{ width: number; height: number }>;
  destroy: () => Promise<void>;
}

export async function loadPdf(data: ArrayBuffer): Promise<LoadedPdf> {
  const pdfjs = await getPdfjs();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  return {
    numPages: doc.numPages,

    async getPageLines(pageNum: number): Promise<ExtractedLine[]> {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();

      type Acc = ExtractedLine & { lastX: number };
      const lines: Acc[] = [];
      let cur: Acc | null = null;

      for (const raw of content.items) {
        if (!("str" in raw)) continue;
        const item = raw as { str: string; transform: number[]; width: number; hasEOL: boolean };
        const str = item.str;
        const t = item.transform;
        const x = t[4];
        const y = t[5];
        const fontSize = Math.hypot(t[2], t[3]) || Math.abs(t[3]) || 12;

        if (!cur || Math.abs(y - cur.y) > fontSize * 0.6) {
          if (cur) lines.push(cur);
          cur = { text: "", fontSize, x, y, lastX: x };
        }

        if (cur.text && str) {
          const gap = x - cur.lastX;
          if (gap > fontSize * 0.2 && !cur.text.endsWith(" ") && !str.startsWith(" ")) {
            cur.text += " ";
          }
        }
        cur.text += str;
        cur.fontSize = Math.max(cur.fontSize, fontSize);
        cur.lastX = x + (item.width || 0);

        if (item.hasEOL) {
          lines.push(cur);
          cur = null;
        }
      }
      if (cur) lines.push(cur);

      page.cleanup();
      return lines.map(({ text, fontSize, x, y }) => ({ text, fontSize, x, y }));
    },

    async renderPage(pageNum: number, scale: number): Promise<HTMLCanvasElement> {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get a 2D canvas context");
      // White matte so transparent PDFs OCR cleanly.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, viewport }).promise;
      page.cleanup();
      return canvas;
    },

    async pageSize(pageNum: number, scale: number) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      return { width: viewport.width, height: viewport.height };
    },

    async destroy() {
      await loadingTask.destroy();
    },
  };
}
