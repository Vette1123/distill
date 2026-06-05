# Distill — Design Spec

_2026-06-05_

## Goal

A web app that converts any PDF or image into clean, copy-paste-ready Markdown so it can
be fed to an AI at a fraction of the token cost of sending the original as an image.

## Constraints (from the user)

- **Totally free, no hassle** → no API keys, no backend, no paid services.
- **Next.js + shadcn**, stunning UI, great UX.
- Output is something you **copy-paste into an AI chat**.
- Handles **anything**: digital PDFs, scanned PDFs, and images.

## Architecture

Pure **client-side** Next.js app (App Router). All processing happens in the browser; no
files are uploaded.

Pipeline:

```
File ─┬─ Image            → Tesseract.js OCR → cleanup → Markdown
      └─ PDF (per page)
            ├─ embedded text present → pdf.js text extraction → cleanup
            └─ little/no text (scanned) → render page to canvas → OCR → cleanup
```

## Components / modules

- `lib/pdf.ts` — pdf.js loader: per-page line extraction (with font size + position) and
  page rasterisation; worker served from `/public` (version-matched, copied on install).
- `lib/ocr.ts` — reusable Tesseract.js worker with per-call progress.
- `lib/markdown.ts` — heuristic cleanup: heading detection by font size, list
  normalisation, paragraph re-flow, de-hyphenation; separate path for raw OCR text.
- `lib/tokens.ts` — GPT tokenizer count for output; high-detail vision-tile estimate for
  the "as image" baseline; savings math.
- `lib/convert.ts` — orchestrates routing, per-page scanned detection, progress, warnings.
- UI: `studio.tsx` (state machine idle→working→done), `dropzone.tsx`, `processing-card.tsx`,
  `result-view.tsx`, `savings-panel.tsx`, `counter.tsx`, `site-header.tsx`.

## UX

Dark "compression lab" aesthetic, acid-lime accent. Drag/drop or paste a screenshot →
animated processing card with stage + progress → result: a token-savings panel
(percent, multiple, comparison bars, word/page/char counts) beside the Markdown output
with copy + download.

## Token-savings model

- Output tokens: `gpt-tokenizer` encode length of the produced Markdown.
- Image baseline: OpenAI high-detail tiling — fit to 2048², scale shortest side to 768,
  `85 + 170 × tiles`, summed across pages. Presented as a conservative estimate.

## Honest limits

Free + local means heuristic OCR and cleanup: great on clean digital PDFs, weaker on messy
handwriting / complex tables. Mostly-visual images are detected and flagged.

## Out of scope (YAGNI)

Cloud/vision-API OCR, accounts, history, batch queue, rendered-Markdown preview tab.

## Status

Implemented and verified end-to-end in a real browser (Chrome DevTools MCP): digital PDF,
multi-page stitching, image OCR, savings math, and clipboard copy all working, no console
errors.
