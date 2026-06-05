"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, Copy, Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ConversionResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavingsPanel } from "./savings-panel";

export function ResultView({
  result,
  onReset,
}: {
  result: ConversionResult;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      toast.success("Copied — paste it into your AI chat");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't access the clipboard");
    }
  };

  const download = () => {
    const blob = new Blob([result.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName.replace(/\.[^.]+$/, "") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-display text-2xl font-bold tracking-tight" title={result.fileName}>
            {result.fileName}
          </p>
          <p className="text-sm text-muted-foreground">Distilled to AI-ready Markdown</p>
        </div>
        <Button variant="outline" onClick={onReset} className="shrink-0 gap-2">
          <RotateCcw className="size-4" /> New file
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <SavingsPanel result={result} />

        <div className="flex min-h-[28rem] flex-col overflow-hidden rounded-3xl border border-border bg-card/50">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-amber/70" />
                <span className="size-2.5 rounded-full bg-muted-foreground/40" />
                <span className="size-2.5 rounded-full bg-lime/80" />
              </span>
              <span className="ml-1 font-mono text-xs text-muted-foreground">output.md</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={download} className="gap-1.5 text-muted-foreground">
                <Download className="size-4" /> .md
              </Button>
              <Button size="sm" onClick={copy} className="gap-1.5">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          <ScrollArea className="h-[26rem] flex-1">
            <pre className="whitespace-pre-wrap break-words p-5 font-mono text-[13px] leading-relaxed text-foreground/90">
              {result.markdown || "— no text found —"}
            </pre>
          </ScrollArea>
        </div>
      </div>
    </motion.div>
  );
}
