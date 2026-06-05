"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "motion/react";
import { FileText, ImageIcon, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,image/*";

export function Dropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [disabled, onFile],
  );

  return (
    <div className="relative">
      {/* lime glow that intensifies on drag */}
      <motion.div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-lime/10 blur-2xl"
        animate={{ opacity: drag ? 0.9 : 0.25, scale: drag ? 1.04 : 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
      />

      <motion.button
        type="button"
        onClick={pick}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        whileTap={{ scale: 0.99 }}
        disabled={disabled}
        className={cn(
          "group relative flex w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-3xl border-2 border-dashed px-8 py-16 text-center transition-colors duration-300 sm:py-20",
          "bg-card/40 backdrop-blur-sm",
          drag
            ? "border-lime glow-ring"
            : "border-border hover:border-lime/60 hover:bg-card/60",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        {/* moving scan line on hover/drag */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime to-transparent opacity-0 transition-opacity",
            drag ? "opacity-100 animate-scan" : "group-hover:opacity-60 group-hover:animate-scan",
          )}
        />

        <motion.div
          animate={{ y: drag ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={cn(
            "flex size-16 items-center justify-center rounded-2xl border transition-colors",
            drag ? "border-lime/50 bg-lime/15 text-lime" : "border-border bg-secondary/60 text-muted-foreground group-hover:text-foreground",
          )}
        >
          <UploadCloud className="size-7" strokeWidth={1.6} />
        </motion.div>

        <div className="space-y-1.5">
          <p className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {drag ? "Drop it right here" : "Drop a file, or click to browse"}
          </p>
          <p className="text-sm text-muted-foreground">
            PDFs, scans, screenshots & photos — up to a few hundred pages
          </p>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-muted-foreground">
            <FileText className="size-3.5" /> PDF
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1 text-muted-foreground">
            <ImageIcon className="size-3.5" /> PNG · JPG · WEBP
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
            e.target.value = "";
          }}
        />
      </motion.button>
    </div>
  );
}
