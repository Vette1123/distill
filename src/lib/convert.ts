import type { ConversionProgress, ConversionResult, SourceKind } from "./types";
import { loadPdf } from "./pdf";
import { ocrImage } from "./ocr";
import {
  pageLinesToMarkdown,
  cleanOcrText,
  finalizeMarkdown,
  countWords,
} from "./markdown";
import { countTokens, estimateImageTokens } from "./tokens";

/** A page with fewer real characters than this is treated as scanned → OCR. */
const SCANNED_PAGE_MIN_CHARS = 12;
/** Image/scan that yields less text than this is probably "mostly visual". */
const VISUAL_MIN_CHARS = 14;
/** Resolution multiplier when rasterising PDF pages for OCR. */
const OCR_SCALE = 2;

type ProgressFn = (p: ConversionProgress) => void;

function isPdf(file: File): boolean {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}
function isImage(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(file.name);
}

export function isSupported(file: File): boolean {
  return isPdf(file) || isImage(file);
}

async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return await new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read image"));
      };
      img.src = url;
    });
  }
}

function buildResult(
  markdown: string,
  meta: {
    kind: SourceKind;
    pageCount: number;
    ocrPages: number;
    warnings: string[];
    imageTokens: number;
    file: File;
  },
): ConversionResult {
  const md = finalizeMarkdown(markdown);
  return {
    markdown: md,
    kind: meta.kind,
    pageCount: meta.pageCount,
    ocrPages: meta.ocrPages,
    warnings: meta.warnings,
    imageTokens: Math.round(meta.imageTokens),
    textTokens: countTokens(md),
    words: countWords(md),
    chars: md.length,
    fileName: meta.file.name,
    fileSize: meta.file.size,
  };
}

async function convertImage(file: File, onProgress: ProgressFn): Promise<ConversionResult> {
  onProgress({ stage: "loading", message: "Reading image…", progress: 0.05 });
  const { width, height } = await imageDimensions(file);

  onProgress({ stage: "ocr", message: "Reading text from image…", progress: 0.1 });
  const raw = await ocrImage(file, (p) => {
    onProgress({
      stage: "ocr",
      message: "Reading text from image…",
      progress: 0.1 + p * 0.8,
    });
  });

  onProgress({ stage: "cleaning", message: "Tidying Markdown…", progress: 0.95 });
  const markdown = cleanOcrText(raw);

  const warnings: string[] = [];
  if (markdown.replace(/\s/g, "").length < VISUAL_MIN_CHARS) {
    warnings.push(
      "This looks like a mostly-visual image — little text was found. You may get better results sending it to the AI as an image.",
    );
  }

  onProgress({ stage: "done", message: "Done", progress: 1 });
  return buildResult(markdown, {
    kind: "image-ocr",
    pageCount: 1,
    ocrPages: 1,
    warnings,
    imageTokens: estimateImageTokens(width, height),
    file,
  });
}

async function convertPdf(file: File, onProgress: ProgressFn): Promise<ConversionResult> {
  onProgress({ stage: "loading", message: "Opening PDF…", progress: 0.03 });
  const buffer = await file.arrayBuffer();
  const pdf = await loadPdf(buffer);
  const total = pdf.numPages;

  const pageMarkdowns: string[] = [];
  let ocrPages = 0;
  let imageTokens = 0;

  try {
    for (let i = 1; i <= total; i++) {
      // Slice of the [0.05, 0.95] band that belongs to this page.
      const bandStart = 0.05 + ((i - 1) / total) * 0.9;
      const bandEnd = 0.05 + (i / total) * 0.9;

      const dims = await pdf.pageSize(i, OCR_SCALE);
      imageTokens += estimateImageTokens(dims.width, dims.height);

      onProgress({
        stage: "extracting",
        message: `Extracting page ${i} of ${total}…`,
        progress: bandStart,
      });

      const lines = await pdf.getPageLines(i);
      const textChars = lines.reduce((n, l) => n + l.text.replace(/\s/g, "").length, 0);

      if (textChars >= SCANNED_PAGE_MIN_CHARS) {
        pageMarkdowns.push(pageLinesToMarkdown(lines));
      } else {
        // Scanned / image-only page → rasterise and OCR it.
        ocrPages++;
        onProgress({
          stage: "ocr",
          message: `Page ${i} looks scanned — reading with OCR…`,
          progress: bandStart,
        });
        const canvas = await pdf.renderPage(i, OCR_SCALE);
        const raw = await ocrImage(canvas, (p) => {
          onProgress({
            stage: "ocr",
            message: `Page ${i} looks scanned — reading with OCR…`,
            progress: bandStart + p * (bandEnd - bandStart),
          });
        });
        canvas.width = canvas.height = 0; // release memory
        pageMarkdowns.push(cleanOcrText(raw));
      }
    }
  } finally {
    await pdf.destroy();
  }

  onProgress({ stage: "cleaning", message: "Tidying Markdown…", progress: 0.96 });
  const markdown = pageMarkdowns.filter(Boolean).join("\n\n");

  const kind: SourceKind =
    ocrPages === 0 ? "pdf-text" : ocrPages === total ? "pdf-ocr" : "pdf-mixed";

  const warnings: string[] = [];
  if (kind === "pdf-ocr") {
    warnings.push(
      `This PDF had no embedded text, so all ${total} page${total > 1 ? "s were" : " was"} read with OCR — accuracy depends on scan quality.`,
    );
  } else if (kind === "pdf-mixed") {
    warnings.push(`${ocrPages} of ${total} pages were scanned and read with OCR.`);
  }
  if (markdown.replace(/\s/g, "").length < VISUAL_MIN_CHARS) {
    warnings.push("Very little text was found — this document may be mostly visual.");
  }

  onProgress({ stage: "done", message: "Done", progress: 1 });
  return buildResult(markdown, {
    kind,
    pageCount: total,
    ocrPages,
    warnings,
    imageTokens,
    file,
  });
}

export async function convertFile(
  file: File,
  onProgress: ProgressFn = () => {},
): Promise<ConversionResult> {
  if (isPdf(file)) return convertPdf(file, onProgress);
  if (isImage(file)) return convertImage(file, onProgress);
  throw new Error("Unsupported file type. Upload a PDF or an image.");
}
