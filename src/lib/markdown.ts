import type { ExtractedLine } from "./types";

const BULLET_RE = /^\s*[•‣◦⁃∙•·▪◦‣∙*]\s+/;
const DASH_BULLET_RE = /^\s*[-–—]\s+/;
const NUMBERED_RE = /^\s*(\d{1,3})[.)]\s+/;
const SENTENCE_END_RE = /[.!?:;”")\]]\s*$/;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Join a hard-wrapped word break: "exam-\nple" -> "example". */
function dehyphenate(prev: string, next: string): string | null {
  if (/[A-Za-z]-$/.test(prev) && /^[a-z]/.test(next)) {
    return prev.replace(/-$/, "") + next;
  }
  return null;
}

type Token =
  | { type: "heading"; level: number; text: string }
  | { type: "bullet"; text: string }
  | { type: "numbered"; text: string }
  | { type: "para"; text: string; y: number; x: number; gap: number };

/**
 * Convert one PDF page's recovered lines into Markdown. Uses font-size to spot
 * headings, leading glyphs to spot lists, and vertical gaps to decide where
 * wrapped lines should be re-joined into flowing paragraphs.
 */
export function pageLinesToMarkdown(lines: ExtractedLine[]): string {
  const clean = lines
    .map((l) => ({ ...l, text: l.text.replace(/\s+/g, " ").trim() }))
    .filter((l) => l.text.length > 0);

  if (clean.length === 0) return "";

  const bodyFont = median(clean.map((l) => l.fontSize)) || 12;

  // Typical gap between consecutive baselines — used to detect paragraph breaks.
  const gaps: number[] = [];
  for (let i = 1; i < clean.length; i++) {
    const g = clean[i - 1].y - clean[i].y;
    if (g > 0) gaps.push(g);
  }
  const bodyGap = median(gaps) || bodyFont * 1.2;

  const tokens: Token[] = [];

  for (let i = 0; i < clean.length; i++) {
    const line = clean[i];
    const gap = i === 0 ? 0 : clean[i - 1].y - line.y;
    const text = line.text;

    if (NUMBERED_RE.test(text)) {
      tokens.push({ type: "numbered", text: text.replace(NUMBERED_RE, "") });
      continue;
    }
    if (BULLET_RE.test(text) || DASH_BULLET_RE.test(text)) {
      tokens.push({
        type: "bullet",
        text: text.replace(BULLET_RE, "").replace(DASH_BULLET_RE, ""),
      });
      continue;
    }

    // Heading: noticeably larger than body text and reasonably short.
    const ratio = line.fontSize / bodyFont;
    if (ratio >= 1.18 && text.length <= 140 && !SENTENCE_END_RE.test(text.slice(-1))) {
      const level = ratio >= 1.8 ? 1 : ratio >= 1.4 ? 2 : 3;
      tokens.push({ type: "heading", level, text });
      continue;
    }

    tokens.push({ type: "para", text, y: line.y, x: line.x, gap });
  }

  // Stitch consecutive paragraph tokens into flowing paragraphs.
  const out: string[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer.trim()) out.push(buffer.trim());
    buffer = "";
  };

  for (const tok of tokens) {
    if (tok.type !== "para") {
      flush();
      if (tok.type === "heading") out.push(`${"#".repeat(tok.level)} ${tok.text}`);
      else if (tok.type === "bullet") out.push(`- ${tok.text}`);
      else out.push(`1. ${tok.text}`);
      continue;
    }

    if (!buffer) {
      buffer = tok.text;
      continue;
    }

    const merged = dehyphenate(buffer, tok.text);
    if (merged) {
      buffer = merged;
      continue;
    }

    // A big vertical jump, or a clean sentence end followed by a capital,
    // means a new paragraph rather than a wrapped continuation.
    const bigGap = tok.gap > bodyGap * 1.6;
    const sentenceBreak = SENTENCE_END_RE.test(buffer) && /^[A-Z0-9“"(\[]/.test(tok.text);
    if (bigGap || sentenceBreak) {
      flush();
      buffer = tok.text;
    } else {
      buffer += " " + tok.text;
    }
  }
  flush();

  return collapseLists(out).join("\n\n");
}

/** Group adjacent list items so they render as a single tight list. */
function collapseLists(blocks: string[]): string[] {
  const result: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      result.push(list.join("\n"));
      list = [];
    }
  };

  for (const b of blocks) {
    if (/^(- |\d+\. )/.test(b)) list.push(b);
    else {
      flushList();
      result.push(b);
    }
  }
  flushList();
  return result;
}

/**
 * Clean a raw OCR text dump into readable Markdown: drop noise, de-hyphenate
 * wrapped words, normalise bullets, and re-flow wrapped lines into paragraphs.
 */
export function cleanOcrText(raw: string): string {
  const rawLines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim());

  const blocks: string[] = [];
  let buffer = "";
  let list: string[] = [];

  const flushPara = () => {
    if (buffer.trim()) blocks.push(buffer.trim());
    buffer = "";
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(list.join("\n"));
      list = [];
    }
  };

  for (const line of rawLines) {
    if (!line) {
      flushList();
      flushPara();
      continue;
    }

    if (NUMBERED_RE.test(line)) {
      flushPara();
      list.push(`1. ${line.replace(NUMBERED_RE, "")}`);
      continue;
    }
    if (BULLET_RE.test(line) || DASH_BULLET_RE.test(line)) {
      flushPara();
      list.push(`- ${line.replace(BULLET_RE, "").replace(DASH_BULLET_RE, "")}`);
      continue;
    }
    flushList();

    if (!buffer) {
      buffer = line;
      continue;
    }
    const merged = dehyphenate(buffer, line);
    if (merged) {
      buffer = merged;
    } else if (SENTENCE_END_RE.test(buffer)) {
      flushPara();
      buffer = line;
    } else {
      buffer += " " + line;
    }
  }
  flushList();
  flushPara();

  return blocks.join("\n\n");
}

/** Tidy the final document: collapse runs of blank lines, trim edges. */
export function finalizeMarkdown(md: string): string {
  return md
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function countWords(text: string): number {
  const m = text.trim().match(/\S+/g);
  return m ? m.length : 0;
}
