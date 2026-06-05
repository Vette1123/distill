export type SourceKind = "pdf-text" | "pdf-ocr" | "pdf-mixed" | "image-ocr";

export type Stage = "loading" | "extracting" | "ocr" | "cleaning" | "done";

export interface ConversionProgress {
  stage: Stage;
  message: string;
  /** 0..1 overall progress for the current file */
  progress: number;
}

export interface ConversionResult {
  markdown: string;
  kind: SourceKind;
  pageCount: number;
  /** how many pages (or images) were read with OCR */
  ocrPages: number;
  warnings: string[];
  /** estimated tokens if the source were sent to an AI as image(s) */
  imageTokens: number;
  /** tokens of the produced markdown */
  textTokens: number;
  words: number;
  chars: number;
  fileName: string;
  fileSize: number;
}

/** A single visual line of text recovered from a PDF page. */
export interface ExtractedLine {
  text: string;
  /** font size in PDF user-space units (≈ px) */
  fontSize: number;
  /** left edge x of the line */
  x: number;
  /** baseline y (PDF space — larger is higher on the page) */
  y: number;
}
