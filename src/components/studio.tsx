"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, ScanText, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import type { ConversionProgress, ConversionResult } from "@/lib/types";
import { convertFile, isSupported } from "@/lib/convert";
import { Dropzone } from "./dropzone";
import { ProcessingCard } from "./processing-card";
import { ResultView } from "./result-view";

type Phase = "idle" | "working" | "done";

const INITIAL_PROGRESS: ConversionProgress = {
  stage: "loading",
  message: "Starting…",
  progress: 0,
};

export function Studio() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<ConversionProgress>(INITIAL_PROGRESS);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!isSupported(file)) {
      toast.error("Unsupported file — please drop a PDF or an image.");
      return;
    }
    setFileName(file.name);
    setProgress(INITIAL_PROGRESS);
    setResult(null);
    setPhase("working");

    try {
      const res = await convertFile(file, setProgress);
      setResult(res);
      setPhase("done");
      if (res.warnings.length === 0) toast.success("Done — your text is ready to copy");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      setPhase("idle");
    }
  }, []);

  // Let users paste a screenshot straight from the clipboard.
  useEffect(() => {
    if (phase !== "idle") return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((it) => it.kind === "file")
        ?.getAsFile();
      if (file) handleFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [phase, handleFile]);

  const reset = () => {
    setPhase("idle");
    setResult(null);
    setFileName("");
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.section
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="mx-auto max-w-2xl pt-10 sm:pt-16"
          >
            <Hero />
            <div className="mt-10">
              <Dropzone onFile={handleFile} />
              <p className="mt-3 text-center text-xs text-muted-foreground/70">
                Nothing is uploaded — your files never leave this device. You can even paste a
                screenshot.
              </p>
            </div>
            <HowItWorks />
          </motion.section>
        )}

        {phase === "working" && (
          <motion.section
            key="working"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pt-20 sm:pt-28"
          >
            <ProcessingCard fileName={fileName} progress={progress} />
          </motion.section>
        )}

        {phase === "done" && result && (
          <motion.section key="done" className="pt-10">
            <ResultView result={result} onReset={reset} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hero() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/[0.06] px-3 py-1 text-xs font-medium tracking-wide text-lime"
      >
        <Sparkles className="size-3.5" />
        FREE · NO API KEYS · NOTHING LEAVES YOUR BROWSER
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="mt-6 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl"
      >
        Stop feeding AI
        <br />
        <span className="text-lime text-glow">expensive pixels.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
      >
        Drop in any PDF or image and get clean, copy-paste-ready Markdown that costs a fraction of
        the tokens. A page sent as an image can cost{" "}
        <span className="font-mono text-foreground">1,100+</span> tokens — as text it&apos;s often a
        tiny slice of that.
      </motion.p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: FileText, title: "Digital PDFs", body: "Real text is extracted instantly — perfect and free." },
    { icon: ScanText, title: "Scans & images", body: "Read with in-browser OCR, no upload, no keys." },
    { icon: Zap, title: "AI-ready output", body: "Clean Markdown plus a live token-savings count." },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35 }}
      className="mt-14 grid gap-4 sm:grid-cols-3"
    >
      {steps.map((s) => (
        <div key={s.title} className="rounded-2xl border border-border bg-card/40 p-5 text-left">
          <s.icon className="size-5 text-lime" strokeWidth={1.7} />
          <p className="mt-3 font-display font-semibold tracking-tight">{s.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        </div>
      ))}
    </motion.div>
  );
}
