"use client";

import { motion } from "motion/react";
import { ScanText } from "lucide-react";
import type { ConversionProgress } from "@/lib/types";
import { Progress } from "@/components/ui/progress";

export function ProcessingCard({
  fileName,
  progress,
}: {
  fileName: string;
  progress: ConversionProgress;
}) {
  const pct = Math.round(progress.progress * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card/60 p-8 backdrop-blur-sm sm:p-10"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* scanning document glyph */}
        <div className="relative flex size-20 items-center justify-center rounded-2xl border border-lime/30 bg-lime/10">
          <ScanText className="size-9 text-lime" strokeWidth={1.5} />
          <span className="pointer-events-none absolute inset-x-3 top-2 h-px bg-lime/80 shadow-[0_0_12px] shadow-lime animate-scan" />
        </div>

        <div className="space-y-1">
          <p className="truncate font-display text-lg font-semibold text-foreground" title={fileName}>
            {fileName}
          </p>
          <p className="text-sm text-muted-foreground">{progress.message}</p>
        </div>

        <div className="w-full space-y-2">
          <Progress value={pct} className="h-2" />
          <div className="flex justify-between font-mono text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">{progress.stage}</span>
            <span className="text-lime">{pct}%</span>
          </div>
        </div>

        {progress.stage === "ocr" && (
          <p className="text-xs text-muted-foreground/70">
            First OCR run downloads a small language model — hang tight.
          </p>
        )}
      </div>
    </motion.div>
  );
}
