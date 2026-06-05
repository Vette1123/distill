"use client";

import { motion } from "motion/react";
import { AlertTriangle, FileText, ImageIcon, Layers, ScanText, TrendingDown } from "lucide-react";
import type { ConversionResult, SourceKind } from "@/lib/types";
import { computeSavings, formatNumber } from "@/lib/tokens";
import { Counter } from "./counter";
import { cn } from "@/lib/utils";

const KIND_META: Record<SourceKind, { label: string; icon: typeof FileText }> = {
  "pdf-text": { label: "Digital PDF · text extracted", icon: FileText },
  "pdf-ocr": { label: "Scanned PDF · OCR", icon: ScanText },
  "pdf-mixed": { label: "Mixed PDF · text + OCR", icon: Layers },
  "image-ocr": { label: "Image · OCR", icon: ImageIcon },
};

export function SavingsPanel({ result }: { result: ConversionResult }) {
  const { imageTokens, textTokens } = result;
  const savings = computeSavings(imageTokens, textTokens);
  const kind = KIND_META[result.kind];
  const KindIcon = kind.icon;

  // width of the "text" bar relative to the "image" bar
  const textPct = imageTokens > 0 ? Math.max(3, (textTokens / imageTokens) * 100) : 100;

  return (
    <div className="flex flex-col gap-5">
      {/* headline savings */}
      <div className="relative overflow-hidden rounded-3xl border border-lime/25 bg-gradient-to-b from-lime/[0.07] to-transparent p-6 sm:p-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-lime/80">
          <TrendingDown className="size-4" /> Token savings
        </div>

        <div className="mt-3 flex items-end gap-3">
          <span className="font-display text-6xl font-extrabold leading-none tracking-tight text-lime text-glow sm:text-7xl">
            <Counter value={savings.percent} format={(n) => `${Math.round(n)}`} />
            <span className="text-3xl sm:text-4xl">%</span>
          </span>
          <span className="mb-1.5 text-sm leading-tight text-muted-foreground">
            fewer tokens
            <br />
            <span className="font-mono text-foreground">
              {savings.multiple >= 1 ? `${savings.multiple.toFixed(1)}× smaller` : "—"}
            </span>
          </span>
        </div>

        {/* comparison bars */}
        <div className="mt-6 space-y-3">
          <BarRow
            label="As image"
            sub="vision tokens"
            value={imageTokens}
            widthPct={100}
            tone="amber"
          />
          <BarRow
            label="As text"
            sub="this Markdown"
            value={textTokens}
            widthPct={textPct}
            tone="lime"
          />
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground/80">
          Image estimate uses the standard high-detail vision tiling formula. You save{" "}
          <span className="font-mono text-foreground">{formatNumber(savings.saved)}</span> tokens
          every time you send this.
        </p>
      </div>

      {/* meta grid */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Words" value={result.words} />
        <Stat label="Pages" value={result.pageCount} />
        <Stat label="Characters" value={result.chars} />
      </div>

      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground">
        <KindIcon className="size-3.5 text-lime" />
        {kind.label}
        {result.ocrPages > 0 && result.kind === "pdf-mixed" && (
          <span className="font-mono">· {result.ocrPages} OCR</span>
        )}
      </div>

      {result.warnings.map((w, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 rounded-xl border border-amber/30 bg-amber/[0.06] p-3 text-xs leading-relaxed text-amber"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="text-foreground/80">{w}</span>
        </motion.div>
      ))}
    </div>
  );
}

function BarRow({
  label,
  sub,
  value,
  widthPct,
  tone,
}: {
  label: string;
  sub: string;
  value: number;
  widthPct: number;
  tone: "amber" | "lime";
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">
          {label} <span className="text-muted-foreground/50">· {sub}</span>
        </span>
        <span className={cn("font-mono text-sm", tone === "lime" ? "text-lime" : "text-amber")}>
          <Counter value={value} />
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-secondary/70">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className={cn(
            "h-full rounded-full",
            tone === "lime"
              ? "bg-lime shadow-[0_0_16px] shadow-lime/50"
              : "bg-amber/70",
          )}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="font-mono text-2xl font-semibold text-foreground">
        <Counter value={value} />
      </div>
      <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
