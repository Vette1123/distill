import { encode } from "gpt-tokenizer";

/** Count tokens with the GPT (o200k/cl100k) tokenizer. Falls back to a
 *  chars/4 heuristic if the encoder ever throws on exotic input. */
export function countTokens(text: string): number {
  if (!text) return 0;
  try {
    return encode(text).length;
  } catch {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Estimate how many tokens an image of the given pixel size would cost if sent
 * to a vision model, using OpenAI's documented high-detail tiling algorithm:
 *   1. fit within 2048×2048
 *   2. scale so the shortest side is 768
 *   3. cost = 85 base + 170 per 512×512 tile
 * Claude's vision pricing lands in the same order of magnitude, so this is a
 * fair, conservative stand-in for "what a page would cost as an image".
 */
export function estimateImageTokens(width: number, height: number): number {
  let w = width;
  let h = height;
  if (!w || !h) return 0;

  const maxSide = Math.max(w, h);
  if (maxSide > 2048) {
    const r = 2048 / maxSide;
    w *= r;
    h *= r;
  }

  const minSide = Math.min(w, h);
  if (minSide > 768) {
    const r = 768 / minSide;
    w *= r;
    h *= r;
  }

  const tiles = Math.ceil(w / 512) * Math.ceil(h / 512);
  return 85 + 170 * tiles;
}

export interface Savings {
  saved: number;
  ratio: number; // 0..1 fraction saved
  percent: number; // rounded whole percent
  multiple: number; // how many times smaller (e.g. 3.4)
}

export function computeSavings(imageTokens: number, textTokens: number): Savings {
  const saved = Math.max(0, imageTokens - textTokens);
  const ratio = imageTokens > 0 ? saved / imageTokens : 0;
  return {
    saved,
    ratio,
    percent: Math.round(ratio * 100),
    multiple: textTokens > 0 ? imageTokens / textTokens : 0,
  };
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}
